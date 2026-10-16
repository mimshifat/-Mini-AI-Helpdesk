"""
Ticket views.

TicketListCreateView : GET (list) + POST (create) — /api/tickets/
TicketDetailView     : GET (retrieve) + PATCH (update) + DELETE — /api/tickets/<id>/

Key design decisions:
- Queryset is scoped in get_queryset() so admins/users always get the right data.
- select_related('creator') prevents N+1 queries on the list endpoint.
- Object-level permissions are checked by IsOwnerOrAdmin.
- PATCH returns the full TicketDetailSerializer response for the frontend.
"""

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Ticket
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketUpdateSerializer,
)
from .permissions import IsOwnerOrAdmin
from .filters import TicketFilter


class TicketListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/tickets/ — list tickets (paginated, filterable, searchable)
    POST /api/tickets/ — create a new ticket
    """

    permission_classes = [IsAuthenticated]
    filterset_class = TicketFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status', 'category']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related('creator')
        # Admins see all tickets; regular users see only their own
        if not user.is_helpdesk_admin():
            qs = qs.filter(creator=user)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TicketCreateSerializer
        return TicketListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        # Return the full detail view of the newly created ticket
        return Response(
            TicketDetailSerializer(ticket, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class TicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/tickets/<id>/ — retrieve ticket detail
    PATCH  /api/tickets/<id>/ — partial update
    DELETE /api/tickets/<id>/ — delete ticket
    """

    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    # Disallow PUT — only PATCH (partial updates) is supported
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related('creator')
        if not user.is_helpdesk_admin():
            qs = qs.filter(creator=user)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return TicketUpdateSerializer
        return TicketDetailSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        # Always return the full detail representation after an update
        return Response(
            TicketDetailSerializer(ticket, context={'request': request}).data
        )
