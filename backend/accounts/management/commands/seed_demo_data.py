"""
Management command: seed_demo_data

Creates two demo accounts (admin + regular user) and sample tickets.
Safe to run multiple times — uses get_or_create throughout.

Usage:
    py manage.py seed_demo_data
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from tickets.models import Ticket


DEMO_USERS = [
    {
        'username': 'admin_demo',
        'email': 'admin@helpdesk.dev',
        'password': 'Admin@1234',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': User.Role.ADMIN,
        'is_staff': True,
    },
    {
        'username': 'user_demo',
        'email': 'user@helpdesk.dev',
        'password': 'User@1234',
        'first_name': 'Regular',
        'last_name': 'User',
        'role': User.Role.USER,
        'is_staff': False,
    },
]

DEMO_TICKETS = [
    {
        'title': 'Cannot log in to billing portal',
        'description': 'I receive a 401 error when trying to access the billing section.',
        'category': Ticket.Category.BILLING,
        'priority': Ticket.Priority.HIGH,
        'status': Ticket.Status.OPEN,
    },
    {
        'title': 'API response time is degraded',
        'description': 'API calls that normally take 200ms now take over 2 seconds.',
        'category': Ticket.Category.TECHNICAL,
        'priority': Ticket.Priority.HIGH,
        'status': Ticket.Status.IN_PROGRESS,
    },
    {
        'title': 'How do I export my invoice history?',
        'description': 'Looking for a way to export all past invoices as a CSV.',
        'category': Ticket.Category.BILLING,
        'priority': Ticket.Priority.LOW,
        'status': Ticket.Status.RESOLVED,
    },
    {
        'title': 'Password reset email not arriving',
        'description': 'I requested a password reset 30 minutes ago but received nothing.',
        'category': Ticket.Category.TECHNICAL,
        'priority': Ticket.Priority.MEDIUM,
        'status': Ticket.Status.OPEN,
    },
    {
        'title': 'Feature request: dark mode',
        'description': 'Would love a dark mode option in the dashboard settings.',
        'category': Ticket.Category.GENERAL,
        'priority': Ticket.Priority.LOW,
        'status': Ticket.Status.OPEN,
    },
]


class Command(BaseCommand):
    help = 'Seed the database with demo users and sample tickets.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        created_users = {}
        for user_data in DEMO_USERS:
            password = user_data.pop('password')
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data,
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'  Created user: {user.username}')
                )
            else:
                self.stdout.write(f'  User already exists: {user.username}')
            # Restore password key for reporting
            user_data['password'] = password
            created_users[user_data['username']] = user

        regular_user = created_users['user_demo']
        for ticket_data in DEMO_TICKETS:
            ticket, created = Ticket.objects.get_or_create(
                title=ticket_data['title'],
                creator=regular_user,
                defaults={**ticket_data},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created ticket: {ticket.title}'))
            else:
                self.stdout.write(f'  Ticket already exists: {ticket.title}')

        self.stdout.write(self.style.SUCCESS('\nDemo data seeded successfully.'))
        self.stdout.write('\nDemo credentials:')
        self.stdout.write('  Admin : admin_demo / Admin@1234')
        self.stdout.write('  User  : user_demo  / User@1234')
