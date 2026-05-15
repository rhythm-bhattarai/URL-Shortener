from rest_framework import APIView
from rest_framework.response import Response
from .models import URL, Click
from .services import generate_short_url

# Create your views here.
