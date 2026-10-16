from django.urls import path
from . import views

urlpatterns = [
    path('suggest/', views.AISuggestView.as_view(), name='ai-suggest'),
    path('draft-resolution/', views.AIDraftResolutionView.as_view(), name='ai-draft-resolution'),
]
