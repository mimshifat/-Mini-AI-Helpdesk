"""
Ticket filters.

Using django-filter for structured filtering via query params.
This keeps filtering logic out of views and makes it testable.
"""

import django_filters
from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Ticket.Status.choices)
    priority = django_filters.ChoiceFilter(choices=Ticket.Priority.choices)
    category = django_filters.ChoiceFilter(choices=Ticket.Category.choices)
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Ticket
        fields = ['status', 'priority', 'category']
