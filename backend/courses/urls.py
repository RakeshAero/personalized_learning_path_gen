from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ModuleViewSet, my_path

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'modules', ModuleViewSet)

urlpatterns = router.urls + [
    path('my-path/', my_path, name='my-path'),
]
