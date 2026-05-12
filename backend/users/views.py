from django.shortcuts import render
from rest_framework import generics
from .models import User
from .serializer import RegisterSerializer

# Register View
class RegisterView(generics.CreateAPIView): # create-only endpoint for registration
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

