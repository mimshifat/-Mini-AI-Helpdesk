from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/tickets/', include('tickets.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/ai/', include('ai_assistant.urls')),
]
