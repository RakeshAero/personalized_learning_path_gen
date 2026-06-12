from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgressViewSet, SubtopicProgressViewSet

router = DefaultRouter()
router.register(r'progress', ProgressViewSet, basename='progress')
router.register(r'subtopic-progress', SubtopicProgressViewSet, basename='subtopic-progress')

urlpatterns = [
    path('', include(router.urls)),
]
