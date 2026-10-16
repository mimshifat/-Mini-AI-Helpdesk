"""
Dashboard statistics view.

GET /api/dashboard/stats/

Uses a single aggregated query (values + annotate) instead of 4 separate
.count() calls to minimise database round-trips.

Admins get global stats; regular users get their own ticket counts.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.db.models import Count, Q

from tickets.models import Ticket


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Scope the queryset first — avoids repeating the filter condition
        if user.is_helpdesk_admin():
            queryset = Ticket.objects.all()
        else:
            queryset = Ticket.objects.filter(creator=user)

        # Single aggregated query using conditional Count expressions
        agg = queryset.aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status=Ticket.Status.OPEN)),
            in_progress=Count('id', filter=Q(status=Ticket.Status.IN_PROGRESS)),
            resolved=Count('id', filter=Q(status=Ticket.Status.RESOLVED)),
        )

        return Response(agg)
