"""
Custom DRF exception handler.

Ensures all error responses follow a consistent JSON shape:
  { "error": "<error_code>", "message": "...", "details": {...} }

This prevents DRF's default varied response formats from leaking
implementation details or confusing the frontend.
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Override DRF's default exception handler to enforce a uniform response shape.
    """
    # First call DRF's default handler so we get standard HTTP errors
    response = exception_handler(exc, context)

    if response is not None:
        # Normalise whatever DRF returned into our standard envelope
        original_data = response.data

        if isinstance(original_data, dict):
            # DRF validation errors: {'field': ['error'], 'non_field_errors': [...]}
            if 'detail' in original_data:
                # Simple detail string (e.g. 403, 404, 401)
                payload = {
                    'error': _status_to_code(response.status_code),
                    'message': str(original_data['detail']),
                }
            else:
                # Field-level validation errors
                payload = {
                    'error': 'validation_error',
                    'message': 'Request validation failed.',
                    'details': original_data,
                }
        elif isinstance(original_data, list):
            payload = {
                'error': 'validation_error',
                'message': 'Request validation failed.',
                'details': original_data,
            }
        else:
            payload = {
                'error': 'error',
                'message': str(original_data),
            }

        response.data = payload
        return response

    # Unhandled exceptions — log them and return a safe 500
    logger.exception('Unhandled exception in view: %s', exc)
    return Response(
        {
            'error': 'internal_server_error',
            'message': 'An unexpected error occurred. Please try again later.',
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _status_to_code(status_code: int) -> str:
    mapping = {
        400: 'bad_request',
        401: 'unauthenticated',
        403: 'forbidden',
        404: 'not_found',
        405: 'method_not_allowed',
        429: 'too_many_requests',
    }
    return mapping.get(status_code, 'error')
