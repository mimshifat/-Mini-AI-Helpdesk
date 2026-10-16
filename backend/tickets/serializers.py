"""
Ticket serializers.

Four serializers for distinct use-cases:
- TicketListSerializer  : lean, for list views (no heavy relations)
- TicketDetailSerializer: full, for retrieve/response after create
- TicketCreateSerializer: write-only fields for creation
- TicketUpdateSerializer: write-only fields for PATCH, with role-based validation
"""

from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Ticket


class TicketListSerializer(serializers.ModelSerializer):
    """Minimal serializer for list endpoints — avoids N+1 with select_related."""

    creator_username = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'title',
            'category',
            'priority',
            'status',
            'creator_username',
            'created_at',
            'updated_at',
        ]


class TicketDetailSerializer(serializers.ModelSerializer):
    """Full read-only serializer. Used for retrieve and as create/update response."""

    creator = UserSerializer(read_only=True)
    creator_username = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'title',
            'description',
            'category',
            'priority',
            'status',
            'agent_response',
            'creator',
            'creator_username',
            'created_at',
            'updated_at',
        ]


class TicketCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for ticket creation.
    `creator` is set automatically from request.user — never from the request body.
    `status` is intentionally excluded; new tickets always start as 'Open'.
    """

    class Meta:
        model = Ticket
        fields = ['title', 'description', 'category', 'priority']

    def create(self, validated_data):
        # Creator is injected server-side — cannot be spoofed by the client
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for PATCH requests.

    Production data-integrity policy:
    - Regular users (creators): may edit title, description, category, priority (not status or agent_response).
    - Helpdesk admins:
        - When triaging customer tickets: may update category, priority, status, agent_response.
          Customer's original inquiry (title and description) is locked for audit integrity.
        - When editing their own created tickets: may update all fields.
    """

    class Meta:
        model = Ticket
        fields = ['title', 'description', 'category', 'priority', 'status', 'agent_response']

    def validate(self, data):
        request = self.context['request']
        instance = self.instance

        # 1. Status transition guard: only admins can change ticket status
        if 'status' in data and not request.user.is_helpdesk_admin():
            raise serializers.ValidationError(
                {'status': 'Only admins can change ticket status.'}
            )

        # 2. Official response guard: only admins can dispatch official agent responses
        if 'agent_response' in data and not request.user.is_helpdesk_admin():
            raise serializers.ValidationError(
                {'agent_response': 'Only support engineers and admins can post official responses.'}
            )

        # 3. Audit integrity guard: admins cannot tamper with customer's original title/description
        if (
            request.user.is_helpdesk_admin()
            and instance
            and instance.creator_id != request.user.id
        ):
            if 'title' in data and data['title'] != instance.title:
                raise serializers.ValidationError(
                    {'title': "Customer statement integrity: Admins cannot alter the customer's original ticket title."}
                )
            if 'description' in data and data['description'] != instance.description:
                raise serializers.ValidationError(
                    {'description': "Customer statement integrity: Admins cannot alter the customer's original inquiry description."}
                )

        return data
