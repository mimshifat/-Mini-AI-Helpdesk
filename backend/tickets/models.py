"""
Ticket model.

Uses TextChoices for all enum fields so values are readable strings
in both the DB and the API (not integers that need a lookup table).
`creator` uses PROTECT so deleting a user doesn't silently wipe tickets.
"""

from django.db import models
from django.conf import settings


class Ticket(models.Model):

    class Category(models.TextChoices):
        TECHNICAL = 'Technical', 'Technical'
        BILLING = 'Billing', 'Billing'
        GENERAL = 'General', 'General'

    class Priority(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'

    class Status(models.TextChoices):
        OPEN = 'Open', 'Open'
        IN_PROGRESS = 'In Progress', 'In Progress'
        RESOLVED = 'Resolved', 'Resolved'

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
        db_index=True,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,  # Prevent accidental data loss
        related_name='tickets',
        db_index=True,
    )
    agent_response = models.TextField(
        blank=True,
        default='',
        help_text='Official resolution or customer response sent by a support engineer.',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tickets_ticket'
        ordering = ['-created_at']
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        indexes = [
            # Composite index for common query patterns
            models.Index(fields=['creator', 'status'], name='ticket_creator_status_idx'),
            models.Index(fields=['status', 'priority'], name='ticket_status_priority_idx'),
        ]

    def __str__(self) -> str:
        return f'[{self.priority}] {self.title} ({self.status})'
