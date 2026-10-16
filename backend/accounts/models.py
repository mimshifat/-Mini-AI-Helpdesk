"""
Custom User model.

Extends AbstractUser so we keep all of Django's built-in auth
(password hashing, permissions, admin integration) while adding
a helpdesk-specific `role` field.

IMPORTANT: AUTH_USER_MODEL must be set BEFORE the first migration.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        USER = 'user', 'User'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        db_index=True,
    )

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def is_helpdesk_admin(self) -> bool:
        """Convenience method — use this instead of checking `role` directly."""
        return self.role == self.Role.ADMIN

    def __str__(self) -> str:
        return f'{self.username} ({self.get_role_display()})'
