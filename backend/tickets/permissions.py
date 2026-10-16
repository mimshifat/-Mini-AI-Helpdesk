"""
Ticket permissions.

IsOwnerOrAdmin: object-level permission that grants access only to
the ticket's creator or a helpdesk admin. Applied on detail views.
"""

from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    """
    Allow access if the requesting user is:
      - A helpdesk admin (role == 'admin'), OR
      - The creator of the specific ticket being accessed.

    Note: has_permission (list/create) is handled by IsAuthenticated.
    This permission is only checked at the object level (detail endpoints).
    """

    message = 'You do not have permission to access this ticket.'

    def has_object_permission(self, request, view, obj):
        if request.user.is_helpdesk_admin():
            return True
        return obj.creator_id == request.user.id
