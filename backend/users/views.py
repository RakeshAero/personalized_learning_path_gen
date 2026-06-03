from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import User
from .serializer import RegisterSerializer , UserProfileSerializer

# Register View
class RegisterView(generics.CreateAPIView): # create-only endpoint for registration
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


# User Profile View
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

    def get(self, request):
        serializer = UserProfileSerializer(request.user)  # Serialize the authenticated user
        return Response(serializer.data)  # Return the serialized user data