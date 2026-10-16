"""
Authentication views.

POST /api/auth/login/  — authenticate, return token + user data
POST /api/auth/logout/ — delete token (invalidates the session)
GET  /api/auth/me/     — return current user data (used on frontend refresh)
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.models import update_last_login

from .serializers import LoginSerializer, UserSerializer, RegisterSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Allows new users to register with username, email, and password.
    Returns JWT access & refresh tokens and authenticated user profile.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        update_last_login(None, user)

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['username'] = user.username

        return Response(
            {
                'message': 'Account created successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/

    Returns JWT access & refresh tokens and authenticated user data.
    Updates the user's last_login timestamp.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Update last login timestamp
        update_last_login(None, user)

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['username'] = user.username

        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Revokes the JWT refresh token by adding it to the blacklist.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET /api/auth/me/

    Returns current authenticated user's data.
    Frontend calls this on startup to restore auth state.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
