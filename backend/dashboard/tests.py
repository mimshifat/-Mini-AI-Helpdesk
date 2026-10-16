"""
Tests for the dashboard app.

Covers:
  - Unauthenticated access → 401
  - Admin gets global stats (all tickets, all users)
  - Regular user gets only their own scoped stats
  - Response shape: total, open, in_progress, resolved
  - Counts are accurate after ticket creation
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from tickets.models import Ticket


class DashboardStatsTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='dash_user', password='Pass@1', role=User.Role.USER
        )
        self.other_user = User.objects.create_user(
            username='dash_other', password='Pass@1', role=User.Role.USER
        )
        self.admin = User.objects.create_user(
            username='dash_admin', password='Pass@1', role=User.Role.ADMIN
        )
        self.url = reverse('dashboard-stats')

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _create_ticket(self, creator, status_val='Open'):
        return Ticket.objects.create(
            title='Test ticket',
            description='Description.',
            category='General',
            priority='Medium',
            status=status_val,
            creator=creator,
        )

    def test_unauthenticated_access_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_response_shape_contains_all_required_keys(self):
        self._auth(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ('total', 'open', 'in_progress', 'resolved'):
            self.assertIn(key, response.data, msg=f'Missing key: {key}')

    def test_user_stats_are_scoped_to_own_tickets_only(self):
        # user has 2 tickets; other_user has 1 — user must NOT see other_user's
        self._create_ticket(self.user, status_val='Open')
        self._create_ticket(self.user, status_val='Resolved')
        self._create_ticket(self.other_user, status_val='Open')

        self._auth(self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['open'], 1)
        self.assertEqual(response.data['resolved'], 1)
        self.assertEqual(response.data['in_progress'], 0)

    def test_admin_stats_span_all_users(self):
        self._create_ticket(self.user, status_val='Open')
        self._create_ticket(self.other_user, status_val='In Progress')
        self._create_ticket(self.other_user, status_val='Resolved')

        self._auth(self.admin)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 3)
        self.assertEqual(response.data['open'], 1)
        self.assertEqual(response.data['in_progress'], 1)
        self.assertEqual(response.data['resolved'], 1)

    def test_empty_dashboard_returns_zeros(self):
        self._auth(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 0)
        self.assertEqual(response.data['open'], 0)
        self.assertEqual(response.data['in_progress'], 0)
        self.assertEqual(response.data['resolved'], 0)
