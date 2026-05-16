from django.urls import path
from .views import ShortenURLView

urlpatterns = [
    path('shorten/', ShortenURLView.as_view(), name='shorten-url'),
]