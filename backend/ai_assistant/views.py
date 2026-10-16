"""
AI Assistant view.

POST /api/ai/suggest/

Thin view: validates input, delegates to the service layer,
and maps domain exceptions to HTTP responses.

All AI errors are non-fatal from the user's perspective —
the response always tells the frontend what the user can do next.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .services import (
    get_ai_suggestion,
    get_resolution_suggestion,
    AIUnavailableError,
    AIInvalidResponseError,
)

logger = logging.getLogger(__name__)

# Input length guards — prevents prompt injection via very long inputs
MAX_TITLE_LENGTH = 500
MAX_DESCRIPTION_LENGTH = 5_000


class AISuggestView(APIView):
    """
    POST /api/ai/suggest/

    Request body:
        { "title": "...", "description": "..." }

    Success response (200):
        { "category": "Technical", "priority": "High", "summary": "..." }

    Error responses:
        400 — validation_error (missing/too-long input)
        503 — ai_unavailable   (timeout, connection error, missing key)
        502 — invalid_response (AI returned unparsable output)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = str(request.data.get('title', '')).strip()
        description = str(request.data.get('description', '')).strip()

        # Input validation
        errors = {}
        if not title:
            errors['title'] = 'Title is required.'
        elif len(title) > MAX_TITLE_LENGTH:
            errors['title'] = f'Title must not exceed {MAX_TITLE_LENGTH} characters.'

        if not description:
            errors['description'] = 'Description is required.'
        elif len(description) > MAX_DESCRIPTION_LENGTH:
            errors['description'] = (
                f'Description must not exceed {MAX_DESCRIPTION_LENGTH} characters.'
            )

        if errors:
            return Response(
                {'error': 'validation_error', 'message': 'Invalid input.', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Call service layer
        try:
            suggestion = get_ai_suggestion(title, description)
            return Response(suggestion, status=status.HTTP_200_OK)

        except AIUnavailableError as exc:
            logger.warning('AI service unavailable: %s', exc)
            return Response(
                {
                    'error': 'ai_unavailable',
                    'message': str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except AIInvalidResponseError as exc:
            logger.warning('AI invalid response: %s', exc)
            return Response(
                {
                    'error': 'invalid_response',
                    'message': str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )


class AIDraftResolutionView(APIView):
    """
    POST /api/ai/draft-resolution/

    Assists support engineers by generating:
    - Customer sentiment detection
    - 3-step internal troubleshooting plan
    - Polished customer draft reply

    Request body:
        { "title": "...", "description": "...", "category": "Technical" }

    Success response (200):
        {
            "sentiment": "Frustrated",
            "internal_action_steps": ["Step 1", "Step 2", "Step 3"],
            "draft_customer_reply": "Dear customer..."
        }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_helpdesk_admin():
            return Response(
                {
                    'error': 'permission_denied',
                    'message': 'Only support engineers and administrators can access the resolution assist copilot.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        title = str(request.data.get('title', '')).strip()
        description = str(request.data.get('description', '')).strip()
        category = str(request.data.get('category', '')).strip()

        errors = {}
        if not title:
            errors['title'] = 'Title is required.'
        elif len(title) > MAX_TITLE_LENGTH:
            errors['title'] = f'Title must not exceed {MAX_TITLE_LENGTH} characters.'

        if not description:
            errors['description'] = 'Description is required.'
        elif len(description) > MAX_DESCRIPTION_LENGTH:
            errors['description'] = (
                f'Description must not exceed {MAX_DESCRIPTION_LENGTH} characters.'
            )

        if errors:
            return Response(
                {'error': 'validation_error', 'message': 'Invalid input.', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resolution = get_resolution_suggestion(title, description, category)
            return Response(resolution, status=status.HTTP_200_OK)

        except AIUnavailableError as exc:
            logger.warning('AI resolution assist unavailable: %s', exc)
            return Response(
                {
                    'error': 'ai_unavailable',
                    'message': str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except AIInvalidResponseError as exc:
            logger.warning('AI resolution assist invalid response: %s', exc)
            return Response(
                {
                    'error': 'invalid_response',
                    'message': str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
