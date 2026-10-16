"""
AI Assistant service layer.

Responsibility: call the external AI API and return a validated,
structured suggestion. All network calls, JSON parsing, and output
validation are isolated here — keeping the view thin.

Error hierarchy:
  AIServiceError        — base, never raised directly
  ├── AIUnavailableError  — network/timeout/auth issues
  └── AIInvalidResponseError — bad JSON or failed validation

Callers (views) catch these specific exceptions and map them to
appropriate HTTP status codes and user-facing messages.
"""

import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Valid values (mirrors Ticket model choices) ───────────────────────────────
VALID_CATEGORIES = frozenset({'Technical', 'Billing', 'General'})
VALID_PRIORITIES = frozenset({'Low', 'Medium', 'High'})


# ─── Exceptions ───────────────────────────────────────────────────────────────

class AIServiceError(Exception):
    """Base exception — not raised directly."""


class AIUnavailableError(AIServiceError):
    """The AI service is unreachable, timed out, or returned an HTTP error."""


class AIInvalidResponseError(AIServiceError):
    """The AI returned a response that could not be parsed or validated."""


# ─── Service function ──────────────────────────────────────────────────────────

def get_ai_suggestion(title: str, description: str) -> dict:
    """
    Send ticket title + description to the AI API and return a validated suggestion.

    Returns:
        {
            "category": "Technical" | "Billing" | "General",
            "priority": "Low" | "Medium" | "High",
            "summary":  "<one or two sentence summary>"
        }

    Raises:
        AIUnavailableError      – API key missing, timeout, connection error, HTTP error
        AIInvalidResponseError  – unparsable JSON, missing keys, invalid enum values
    """
    if not settings.AI_API_KEY:
        raise AIUnavailableError(
            'AI API key is not configured. Please fill in the fields manually.'
        )

    prompt = _build_prompt(title, description)
    payload = {
        'model': settings.AI_MODEL,
        'messages': [
            {
                'role': 'system',
                'content': (
                    'You are a helpdesk assistant. '
                    'You respond ONLY with a valid JSON object — no markdown, no explanation.'
                ),
            },
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.2,   # Low temperature → more deterministic, structured output
        'max_tokens': 200,
    }
    headers = {
        'Authorization': f'Bearer {settings.AI_API_KEY}',
        'Content-Type': 'application/json',
    }

    raw_response = _call_api(payload, headers)
    data = _parse_response(raw_response)
    return _validate(data)


# ─── Internal helpers ──────────────────────────────────────────────────────────

def _build_prompt(title: str, description: str) -> str:
    return f"""Analyze the following support ticket and respond with ONLY this JSON:

{{
  "category": "<one of: Technical, Billing, General>",
  "priority": "<one of: Low, Medium, High>",
  "summary": "<one or two sentence summary of the issue>"
}}

Title: {title}
Description: {description}"""


def _call_api(payload: dict, headers: dict) -> requests.Response:
    """
    Execute the HTTP request and translate network-layer errors
    into domain-specific AIUnavailableError.
    """
    try:
        response = requests.post(
            settings.AI_API_URL,
            json=payload,
            headers=headers,
            timeout=settings.AI_TIMEOUT,
        )
        response.raise_for_status()
        return response

    except requests.Timeout:
        logger.warning(
            'AI API request timed out after %s seconds.', settings.AI_TIMEOUT
        )
        raise AIUnavailableError(
            f'AI service did not respond within {settings.AI_TIMEOUT} seconds. '
            'You can fill in the fields manually.'
        )
    except requests.ConnectionError:
        logger.warning('AI API connection error — service may be unreachable.')
        raise AIUnavailableError(
            'Could not connect to the AI service. You can fill in the fields manually.'
        )
    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 'unknown'
        logger.error('AI API returned HTTP %s.', status_code)
        if status_code == 401:
            raise AIUnavailableError('AI API key is invalid or expired.')
        if status_code == 429:
            raise AIUnavailableError('AI API rate limit reached. Please try again shortly.')
        raise AIUnavailableError(
            f'AI service returned an error (HTTP {status_code}). '
            'You can fill in the fields manually.'
        )


def _parse_response(response: requests.Response) -> dict:
    """
    Extract and parse the JSON content from the AI API response envelope.
    """
    try:
        envelope = response.json()
        content = envelope['choices'][0]['message']['content'].strip()

        # Strip markdown code fences if the model wrapped the JSON
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()

        return json.loads(content)

    except (KeyError, IndexError) as exc:
        logger.error('Unexpected AI API response envelope: %s', exc)
        raise AIInvalidResponseError(
            'AI returned an unexpected response structure.'
        )
    except json.JSONDecodeError as exc:
        logger.error('AI response is not valid JSON: %s', exc)
        raise AIInvalidResponseError(
            'AI returned a response that could not be parsed as JSON.'
        )


def _validate(data: dict) -> dict:
    """
    Validate that the parsed AI output contains acceptable enum values.
    """
    category = str(data.get('category', '')).strip()
    priority = str(data.get('priority', '')).strip()
    summary = str(data.get('summary', '')).strip()

    if category not in VALID_CATEGORIES:
        logger.warning('AI returned invalid category: %r', category)
        raise AIInvalidResponseError(
            f'AI returned an unrecognised category "{category}". '
            'Please select a category manually.'
        )
    if priority not in VALID_PRIORITIES:
        logger.warning('AI returned invalid priority: %r', priority)
        raise AIInvalidResponseError(
            f'AI returned an unrecognised priority "{priority}". '
            'Please select a priority manually.'
        )
    if not summary:
        raise AIInvalidResponseError('AI returned an empty summary.')

    return {
        'category': category,
        'priority': priority,
        'summary': summary,
    }


# ─── Resolution Assist Service ────────────────────────────────────────────────

VALID_SENTIMENTS = frozenset({'Frustrated', 'Neutral', 'Positive'})


def get_resolution_suggestion(title: str, description: str, category: str = '') -> dict:
    """
    Generate an agent-assist resolution package:
    - Customer sentiment detection
    - 3-step internal troubleshooting action plan
    - Polished, ready-to-use customer draft reply

    Returns:
        {
            "sentiment": "Frustrated" | "Neutral" | "Positive",
            "internal_action_steps": ["step 1", "step 2", "step 3"],
            "draft_customer_reply": "Dear user..."
        }
    """
    if not settings.AI_API_KEY:
        raise AIUnavailableError(
            'AI API key is not configured. Please draft the reply manually.'
        )

    prompt = _build_resolution_prompt(title, description, category)
    payload = {
        'model': settings.AI_MODEL,
        'messages': [
            {
                'role': 'system',
                'content': (
                    'You are an expert technical support lead. '
                    'You respond ONLY with a valid JSON object — no markdown formatting, no backticks, no filler.'
                ),
            },
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.3,
        'max_tokens': 500,
    }
    headers = {
        'Authorization': f'Bearer {settings.AI_API_KEY}',
        'Content-Type': 'application/json',
    }

    raw_response = _call_api(payload, headers)
    data = _parse_response(raw_response)
    return _validate_resolution(data)


def _build_resolution_prompt(title: str, description: str, category: str) -> str:
    return f"""Analyze the support ticket below and provide an agent resolution package in ONLY this JSON format:

{{
  "sentiment": "<one of: Frustrated, Neutral, Positive>",
  "internal_action_steps": [
    "<action step 1 for support engineer>",
    "<action step 2 for support engineer>",
    "<action step 3 for support engineer>"
  ],
  "draft_customer_reply": "<professional, empathetic customer response addressing the issue>"
}}

Category: {category or 'General'}
Title: {title}
Description: {description}"""


def _validate_resolution(data: dict) -> dict:
    sentiment = str(data.get('sentiment', 'Neutral')).strip().capitalize()
    if sentiment not in VALID_SENTIMENTS:
        sentiment = 'Neutral'

    raw_steps = data.get('internal_action_steps', [])
    if isinstance(raw_steps, list) and raw_steps:
        action_steps = [str(s).strip() for s in raw_steps if str(s).strip()]
    else:
        action_steps = ['Review customer ticket details and reproduce the reported issue.']

    draft_reply = str(data.get('draft_customer_reply', '')).strip()
    if not draft_reply:
        raise AIInvalidResponseError('AI failed to generate a draft customer reply.')

    return {
        'sentiment': sentiment,
        'internal_action_steps': action_steps,
        'draft_customer_reply': draft_reply,
    }
