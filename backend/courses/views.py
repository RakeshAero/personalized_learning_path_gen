from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets
from .models import Course, Module
from .serializers import CourseSerializer, ModuleSerializer
from .permissions import IsInstructorOrReadOnly

class CourseViewSet(viewsets.ModelViewSet): # ModelViewSet have defalut create(),update(),list() for GET,POST,PUT,DELETE
    queryset = Course.objects.all()     # Database Record that View will interact with
    serializer_class = CourseSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        # This tells Django: "When saving this course, set the 
        # instructor field to whoever is currently logged in."
        serializer.save(instructor=self.request.user)

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
