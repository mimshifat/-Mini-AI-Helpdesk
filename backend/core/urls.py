from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "ok", "app": "mini-ai-helpdesk"})


urlpatterns = [
    path('', health_check, name='health-check-root'),
    path('health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/tickets/', include('tickets.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/ai/', include('ai_assistant.urls')),
]

