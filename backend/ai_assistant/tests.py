"""
Tests for the ai_assistant app.

Strategy: we never make real HTTP calls in tests.
We use unittest.mock.patch to replace the external `requests.post` call
inside services._call_api with controlled fake responses.

Covers:
  - Missing AI API key → 503 ai_unavailable (no real API needed)
  - Unauthenticated access → 401
  - Missing title → 400 validation_error
  - Missing description → 400 validation_error
  - Successful AI response → 200 with category, priority, summary
  - AI returns invalid category → 502 invalid_response
  - AI returns invalid JSON → 502 invalid_response
  - Network timeout → 503 ai_unavailable
  - Connection error → 503 ai_unavailable
  - HTTP 401 from AI → 503 ai_unavailable
  - HTTP 429 rate limit from AI → 503 ai_unavailable

NOTE: All tests that simulate a working AI key use Django's override_settings
to inject a fake key without touching the real .env file.
"""

import json
from unittest.mock import patch, MagicMock

from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
import requests

from accounts.models import User


AI_SETTINGS = {
    'AI_API_KEY': 'test-key-fake',
    'AI_API_URL': 'https://fake-ai.example.com/v1/chat/completions',
    'AI_MODEL': 'gpt-4o-mini',
    'AI_TIMEOUT': 10,
}


def _make_fake_response(category='Technical', priority='High', summary='Test summary.'):
    """Build a mock requests.Response that looks like a successful OpenAI response."""
    payload = {
        'choices': [
            {
                'message': {
                    'content': json.dumps({
                        'category': category,
                        'priority': priority,
                        'summary': summary,
                    })
                }
            }
        ]
    }
    mock_response = MagicMock()
    mock_response.json.return_value = payload
    mock_response.raise_for_status = MagicMock()
    return mock_response


class AISuggestViewTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='ai_tester', password='Pass@1', role=User.Role.USER
        )
        token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        self.url = reverse('ai-suggest')
        self.valid_payload = {
            'title': 'Cannot login to my account',
            'description': 'I get a 401 error every time I try to login. I reset my password but it still fails.',
        }

    # ─── Auth guard ────────────────────────────────────────────────────────────

    def test_unauthenticated_request_returns_401(self):
        self.client.credentials()  # clear auth
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ─── Input validation ──────────────────────────────────────────────────────

    def test_missing_title_returns_400(self):
        response = self.client.post(
            self.url, {'description': 'Some description.'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'validation_error')
        self.assertIn('title', response.data['details'])

    def test_missing_description_returns_400(self):
        response = self.client.post(
            self.url, {'title': 'Some title'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'validation_error')
        self.assertIn('description', response.data['details'])

    def test_empty_fields_return_400(self):
        response = self.client.post(
            self.url, {'title': '', 'description': ''}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ─── Missing API key ───────────────────────────────────────────────────────

    @override_settings(AI_API_KEY='', AI_API_URL='', AI_MODEL='gpt-4o-mini', AI_TIMEOUT=10)
    def test_missing_api_key_returns_503_without_crashing(self):
        """
        Critical: if no API key is configured, the app must return a structured
        503 — never a 500 Internal Server Error.
        """
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')
        # Message must guide the user toward manual entry
        self.assertIn('manual', response.data['message'].lower())

    # ─── Successful AI response ────────────────────────────────────────────────

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_valid_ai_response_returns_200_with_structured_output(self, mock_post):
        mock_post.return_value = _make_fake_response('Billing', 'High', 'User cannot login due to auth error.')
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['category'], 'Billing')
        self.assertEqual(response.data['priority'], 'High')
        self.assertIn('summary', response.data)
        self.assertTrue(len(response.data['summary']) > 0)

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_ai_suggestion_contains_all_required_fields(self, mock_post):
        mock_post.return_value = _make_fake_response('Technical', 'Medium', 'Network issue summary.')
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ('category', 'priority', 'summary'):
            self.assertIn(field, response.data, msg=f'Missing field: {field}')

    # ─── Invalid AI output ─────────────────────────────────────────────────────

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_invalid_category_from_ai_returns_502(self, mock_post):
        """If AI returns a category outside the allowed set, return 502 not 500."""
        mock_post.return_value = _make_fake_response(
            category='OutOfScope', priority='High', summary='Summary.'
        )
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.data['error'], 'invalid_response')

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_invalid_priority_from_ai_returns_502(self, mock_post):
        mock_post.return_value = _make_fake_response(
            category='Technical', priority='Critical', summary='Summary.'
        )
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.data['error'], 'invalid_response')

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_ai_returns_invalid_json_returns_502(self, mock_post):
        """If the AI model wraps its response in non-parsable text, we return 502."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Sorry, I cannot help with that.'}}]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.data['error'], 'invalid_response')

    # ─── Network-level failures ─────────────────────────────────────────────────

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post', side_effect=requests.Timeout)
    def test_ai_timeout_returns_503(self, mock_post):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post', side_effect=requests.ConnectionError)
    def test_ai_connection_error_returns_503(self, mock_post):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_ai_http_401_returns_503(self, mock_post):
        """Invalid API key (401 from provider) must return 503, not crash."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.HTTPError(
            response=MagicMock(status_code=401)
        )
        mock_post.return_value = mock_response
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_ai_rate_limit_429_returns_503(self, mock_post):
        """Rate limit from AI provider must return 503 with a clear message."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.HTTPError(
            response=MagicMock(status_code=429)
        )
        mock_post.return_value = mock_response
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')


def _make_fake_resolution_response(sentiment='Frustrated', steps=None, reply='Dear customer, we are working on it.'):
    steps = steps or ['Verify DNS records', 'Check load balancer status', 'Purge CDN cache']
    payload = {
        'choices': [
            {
                'message': {
                    'content': json.dumps({
                        'sentiment': sentiment,
                        'internal_action_steps': steps,
                        'draft_customer_reply': reply,
                    })
                }
            }
        ]
    }
    mock_response = MagicMock()
    mock_response.json.return_value = payload
    mock_response.raise_for_status = MagicMock()
    return mock_response


class AIDraftResolutionViewTests(APITestCase):
    """Tests for POST /api/ai/draft-resolution/"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='resolution_agent', password='Pass@1', role=User.Role.ADMIN
        )
        token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        self.url = reverse('ai-draft-resolution')
        self.payload = {
            'title': 'Production database latency spiking',
            'description': 'Our PostgreSQL instance latency went up to 1500ms since 2pm.',
            'category': 'Technical',
        }

    def test_unauthenticated_request_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_access_resolution_copilot_returns_403(self):
        regular_user = User.objects.create_user(
            username='regular_customer', password='Pass@1', role=User.Role.USER
        )
        reg_token, _ = Token.objects.get_or_create(user=regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {reg_token.key}')
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'permission_denied')

    def test_missing_title_returns_400(self):
        response = self.client.post(
            self.url, {'description': 'desc', 'category': 'General'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'validation_error')

    @override_settings(AI_API_KEY='')
    def test_missing_ai_key_returns_503_without_calling_external_api(self):
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post')
    def test_successful_resolution_returns_200_and_structured_payload(self, mock_post):
        mock_post.return_value = _make_fake_resolution_response(
            sentiment='Frustrated',
            steps=['Check slow query log', 'Verify database connections'],
            reply='Hello, we are investigating the database latency.',
        )
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sentiment'], 'Frustrated')
        self.assertEqual(len(response.data['internal_action_steps']), 2)
        self.assertIn('database latency', response.data['draft_customer_reply'])

    @override_settings(**AI_SETTINGS)
    @patch('ai_assistant.services.requests.post', side_effect=requests.Timeout)
    def test_timeout_returns_503(self, mock_post):
        response = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error'], 'ai_unavailable')
