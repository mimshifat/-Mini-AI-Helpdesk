from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'priority', 'status', 'creator', 'created_at']
    list_filter = ['status', 'priority', 'category']
    search_fields = ['title', 'description', 'creator__username']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    list_select_related = ['creator']
