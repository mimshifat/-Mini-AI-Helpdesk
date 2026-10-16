"""
Tests for the accounts app.

Covers:
  - Successful login → 200 + token + user data
  - Wrong credentials → 400
  - Missing fields  → 400
  - /me/ without auth → 401
  - /me/ with valid token → 200 + correct user data
  - Logout invalidates token
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User


class AuthTestCase(APITestCase):
    """Base class: creates a standard user and an admin for reuse."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPass@99',
            role=User.Role.USER,
        )
        self.admin = User.objects.create_user(
            username='testadmin',
            password='AdminPass@99',
            role=User.Role.ADMIN,
        )

    def _login(self, username, password):
        """Helper: POST to /api/auth/login/ and return the response."""
        return self.client.post(
            reverse('auth-login'),
            {'username': username, 'password': password},
            format='json',
        )

    def _auth_header(self, user):
        """Helper: return a JWT Bearer auth header for the given user."""
        refresh = RefreshToken.for_user(user)
        return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}


class LoginViewTests(AuthTestCase):
    """POST /api/auth/login/"""

    def test_login_with_valid_credentials_returns_200_and_tokens(self):
        response = self._login('testuser', 'TestPass@99')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertEqual(response.data['user']['role'], 'user')

    def test_admin_login_returns_admin_role(self):
        response = self._login('testadmin', 'AdminPass@99')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], 'admin')

    def test_login_with_wrong_password_returns_400(self):
        response = self._login('testuser', 'wrongpassword')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('access', response.data)

    def test_login_with_nonexistent_username_returns_400(self):
        response = self._login('nobody', 'TestPass@99')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_missing_fields_returns_400(self):
        response = self.client.post(
            reverse('auth-login'),
            {'username': 'testuser'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_is_accessible_without_authentication(self):
        """Login must be publicly accessible — no auth should be required."""
        response = self._login('testuser', 'TestPass@99')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MeViewTests(AuthTestCase):
    """GET /api/auth/me/"""

    def test_me_without_token_returns_401(self):
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_with_valid_token_returns_user_data(self):
        response = self.client.get(
            reverse('auth-me'),
            **self._auth_header(self.user),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['role'], 'user')

    def test_me_for_admin_returns_admin_role(self):
        response = self.client.get(
            reverse('auth-me'),
            **self._auth_header(self.admin),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')


class LogoutViewTests(AuthTestCase):
    """POST /api/auth/logout/"""

    def test_logout_returns_200(self):
        response = self.client.post(
            reverse('auth-logout'),
            **self._auth_header(self.user),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_without_token_returns_401(self):
        response = self.client.post(reverse('auth-logout'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JwtTokenTests(AuthTestCase):
    """Tests for JWT access and refresh token lifecycle."""

    def test_login_returns_access_and_refresh_tokens(self):
        response = self._login('testuser', 'TestPass@99')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(len(response.data['access']) > 20)
        self.assertTrue(len(response.data['refresh']) > 20)

    def test_access_token_authenticates_protected_endpoints(self):
        login_res = self._login('testuser', 'TestPass@99')
        access = login_res.data['access']

        response = self.client.get(
            reverse('auth-me'),
            HTTP_AUTHORIZATION=f'Bearer {access}',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_token_refresh_rotates_and_returns_new_access_token(self):
        login_res = self._login('testuser', 'TestPass@99')
        refresh = login_res.data['refresh']

        response = self.client.post(
            reverse('token-refresh'),
            {'refresh': refresh},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        # Verify the new access token works
        new_access = response.data['access']
        me_res = self.client.get(
            reverse('auth-me'),
            HTTP_AUTHORIZATION=f'Bearer {new_access}',
        )
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)

    def test_logout_blacklists_refresh_token(self):
        login_res = self._login('testuser', 'TestPass@99')
        access = login_res.data['access']
        refresh = login_res.data['refresh']

        logout_res = self.client.post(
            reverse('auth-logout'),
            {'refresh': refresh},
            HTTP_AUTHORIZATION=f'Bearer {access}',
            format='json',
        )
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Attempting to refresh with the blacklisted refresh token should fail with 401
        refresh_attempt = self.client.post(
            reverse('token-refresh'),
            {'refresh': refresh},
            format='json',
        )
        self.assertEqual(refresh_attempt.status_code, status.HTTP_401_UNAUTHORIZED)


class RegisterViewTests(APITestCase):
    """POST /api/auth/register/"""

    def test_register_with_valid_data_returns_201_and_user_tokens(self):
        payload = {
            'username': 'newcustomer',
            'email': 'customer@example.com',
            'password': 'StrongPassword@123',
        }
        response = self.client.post(reverse('auth-register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'newcustomer')
        self.assertEqual(response.data['user']['email'], 'customer@example.com')
        self.assertEqual(response.data['user']['role'], 'user')

        # Verify user in database
        user = User.objects.get(username='newcustomer')
        self.assertEqual(user.email, 'customer@example.com')
        self.assertEqual(user.role, User.Role.USER)
        self.assertTrue(user.check_password('StrongPassword@123'))

    def test_newly_registered_user_can_subsequently_login(self):
        # 1. Register
        payload = {
            'username': 'logintestuser',
            'email': 'logintest@example.com',
            'password': 'LoginPassword@123',
        }
        reg_response = self.client.post(reverse('auth-register'), payload, format='json')
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)

        # 2. Login
        login_response = self.client.post(
            reverse('auth-login'),
            {'username': 'logintestuser', 'password': 'LoginPassword@123'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertEqual(login_response.data['user']['username'], 'logintestuser')
        self.assertEqual(login_response.data['user']['role'], 'user')

    def test_register_duplicate_username_fails(self):
        User.objects.create_user(username='existinguser', email='first@example.com', password='Password@123')
        payload = {
            'username': 'existinguser',
            'email': 'second@example.com',
            'password': 'Password@123',
        }
        response = self.client.post(reverse('auth-register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email_fails(self):
        User.objects.create_user(username='firstuser', email='shared@example.com', password='Password@123')
        payload = {
            'username': 'seconduser',
            'email': 'shared@example.com',
            'password': 'Password@123',
        }
        response = self.client.post(reverse('auth-register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_fails(self):
        payload = {
            'username': 'shortpassuser',
            'email': 'short@example.com',
            'password': '123',
        }
        response = self.client.post(reverse('auth-register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields_fails(self):
        response = self.client.post(reverse('auth-register'), {'username': 'incomplete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

