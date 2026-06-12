from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ModuleViewSet, SubtopicViewSet, my_path, my_enrollments

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'subtopics', SubtopicViewSet)

urlpatterns = router.urls + [
    path('my-path/', my_path, name='my-path'),
    path('enrollments/', my_enrollments, name='my-enrollments'),
]
