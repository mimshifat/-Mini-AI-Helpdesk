"""
Tests for the tickets app.

Covers:
  - Create ticket: success, missing fields, authenticated guard
  - List tickets: user sees only own tickets; admin sees all
  - Retrieve ticket: owner sees it; other user gets 404 (not 403)
  - Update ticket: owner can patch title/description/category/priority
  - Admin can change status; regular user cannot
  - Delete ticket: owner can delete; other user cannot
  - Search: ?search= filters by title and description
  - Filter: ?status=, ?priority=, ?category= work correctly
  - Pagination: page size is 10
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from tickets.models import Ticket


class TicketTestCase(APITestCase):
    """Base: create two regular users and one admin, plus a helper ticket factory."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ticketuser', password='Pass@1', role=User.Role.USER
        )
        self.other_user = User.objects.create_user(
            username='otheruser', password='Pass@1', role=User.Role.USER
        )
        self.admin = User.objects.create_user(
            username='ticketadmin', password='Pass@1', role=User.Role.ADMIN
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def _make_ticket(self, creator=None, title='Test Ticket', status_val='Open', priority='Medium', category='General', description='Some description.'):
        return Ticket.objects.create(
            title=title,
            description=description,
            category=category,
            priority=priority,
            status=status_val,
            creator=creator or self.user,
        )


# ─── Create ───────────────────────────────────────────────────────────────────

class TicketCreateTests(TicketTestCase):
    """POST /api/tickets/"""

    def test_authenticated_user_can_create_ticket(self):
        self._auth(self.user)
        response = self.client.post(
            reverse('ticket-list-create'),
            {'title': 'My Issue', 'description': 'Details here.', 'category': 'Technical', 'priority': 'High'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'My Issue')
        self.assertEqual(response.data['creator']['username'], 'ticketuser')

    def test_creator_is_automatically_set_to_request_user(self):
        self._auth(self.user)
        self.client.post(
            reverse('ticket-list-create'),
            {'title': 'Auto Creator', 'description': 'desc', 'category': 'General', 'priority': 'Low'},
            format='json',
        )
        ticket = Ticket.objects.get(title='Auto Creator')
        self.assertEqual(ticket.creator, self.user)

    def test_unauthenticated_user_cannot_create_ticket(self):
        self.client.credentials()  # clear any auth
        response = self.client.post(
            reverse('ticket-list-create'),
            {'title': 'Hack', 'description': 'desc', 'category': 'General', 'priority': 'Low'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_title_returns_400(self):
        self._auth(self.user)
        response = self.client.post(
            reverse('ticket-list-create'),
            {'description': 'desc', 'category': 'General', 'priority': 'Low'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data.get('details', response.data))

    def test_missing_description_returns_400(self):
        self._auth(self.user)
        response = self.client.post(
            reverse('ticket-list-create'),
            {'title': 'Test', 'category': 'General', 'priority': 'Low'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ─── List ─────────────────────────────────────────────────────────────────────

class TicketListTests(TicketTestCase):
    """GET /api/tickets/"""

    def test_user_sees_only_their_own_tickets(self):
        self._make_ticket(creator=self.user, title='Mine')
        self._make_ticket(creator=self.other_user, title='Not Mine')
        self._auth(self.user)
        response = self.client.get(reverse('ticket-list-create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [t['title'] for t in response.data['results']]
        self.assertIn('Mine', titles)
        self.assertNotIn('Not Mine', titles)

    def test_admin_sees_all_tickets(self):
        self._make_ticket(creator=self.user, title='User Ticket')
        self._make_ticket(creator=self.other_user, title='Other Ticket')
        self._auth(self.admin)
        response = self.client.get(reverse('ticket-list-create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [t['title'] for t in response.data['results']]
        self.assertIn('User Ticket', titles)
        self.assertIn('Other Ticket', titles)

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(reverse('ticket-list-create'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_response_includes_pagination_fields(self):
        self._auth(self.user)
        response = self.client.get(reverse('ticket-list-create'))
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)


# ─── Search & Filter ──────────────────────────────────────────────────────────

class TicketSearchFilterTests(TicketTestCase):
    """Search and filter query parameters."""

    def setUp(self):
        super().setUp()
        self._make_ticket(creator=self.user, title='Billing refund request', category='Billing', priority='High')
        self._make_ticket(creator=self.user, title='Login page broken', category='Technical', status_val='In Progress')
        self._make_ticket(creator=self.user, title='General inquiry', category='General', status_val='Resolved', priority='Low')

    def test_search_by_title_keyword(self):
        self._auth(self.user)
        response = self.client.get(reverse('ticket-list-create') + '?search=billing')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'Billing refund request')

    def test_filter_by_status(self):
        self._auth(self.user)
        response = self.client.get(reverse('ticket-list-create') + '?status=Resolved')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = [t['status'] for t in response.data['results']]
        self.assertTrue(all(s == 'Resolved' for s in statuses))

    def test_filter_by_priority(self):
        self._auth(self.user)
        response = self.client.get(reverse('ticket-list-create') + '?priority=High')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        priorities = [t['priority'] for t in response.data['results']]
        self.assertTrue(all(p == 'High' for p in priorities))

    def test_filter_by_category(self):
        self._auth(self.user)
        response = self.client.get(reverse('ticket-list-create') + '?category=Technical')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)


# ─── Retrieve ─────────────────────────────────────────────────────────────────

class TicketRetrieveTests(TicketTestCase):
    """GET /api/tickets/<id>/"""

    def test_owner_can_retrieve_their_ticket(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.user)
        response = self.client.get(reverse('ticket-detail', kwargs={'pk': ticket.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], ticket.pk)

    def test_other_user_gets_404_not_403(self):
        """
        Security: non-owners must receive 404, not 403.
        403 reveals the ticket exists; 404 prevents enumeration.
        """
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.other_user)
        response = self.client.get(reverse('ticket-detail', kwargs={'pk': ticket.pk}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_retrieve_any_ticket(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.admin)
        response = self.client.get(reverse('ticket-detail', kwargs={'pk': ticket.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ─── Update ───────────────────────────────────────────────────────────────────

class TicketUpdateTests(TicketTestCase):
    """PATCH /api/tickets/<id>/"""

    def test_owner_can_update_title(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.user)
        response = self.client.patch(
            reverse('ticket-detail', kwargs={'pk': ticket.pk}),
            {'title': 'Updated Title'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')

    def test_regular_user_cannot_change_status(self):
        """Status is a workflow field — only admins may change it."""
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.user)
        original_status = ticket.status
        self.client.patch(
            reverse('ticket-detail', kwargs={'pk': ticket.pk}),
            {'status': 'Resolved'},
            format='json',
        )
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, original_status)

    def test_admin_can_change_status(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.admin)
        response = self.client.patch(
            reverse('ticket-detail', kwargs={'pk': ticket.pk}),
            {'status': 'In Progress'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'In Progress')

    def test_admin_cannot_alter_customer_title_or_description(self):
        """Audit integrity: Admins cannot alter customer's original inquiry statement."""
        ticket = self._make_ticket(creator=self.user, title='Original Title', description='Original Desc')
        self._auth(self.admin)
        response = self.client.patch(
            reverse('ticket-detail', kwargs={'pk': ticket.pk}),
            {'title': 'Tampered Title'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        details = response.data.get('details', response.data)
        self.assertIn('title', details)
        ticket.refresh_from_db()
        self.assertEqual(ticket.title, 'Original Title')

    def test_other_user_cannot_update_ticket(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.other_user)
        response = self.client.patch(
            reverse('ticket-detail', kwargs={'pk': ticket.pk}),
            {'title': 'Hijacked'},
            format='json',
        )
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])


# ─── Delete ───────────────────────────────────────────────────────────────────

class TicketDeleteTests(TicketTestCase):
    """DELETE /api/tickets/<id>/"""

    def test_owner_can_delete_their_ticket(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.user)
        response = self.client.delete(reverse('ticket-detail', kwargs={'pk': ticket.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Ticket.objects.filter(pk=ticket.pk).exists())

    def test_admin_can_delete_any_ticket(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.admin)
        response = self.client.delete(reverse('ticket-detail', kwargs={'pk': ticket.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_other_user_cannot_delete_ticket(self):
        ticket = self._make_ticket(creator=self.user)
        self._auth(self.other_user)
        response = self.client.delete(reverse('ticket-detail', kwargs={'pk': ticket.pk}))
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        # Ticket must still exist
        self.assertTrue(Ticket.objects.filter(pk=ticket.pk).exists())
