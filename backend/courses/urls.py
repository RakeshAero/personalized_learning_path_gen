from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ModuleViewSet

router = DefaultRouter()

router.register(r'courses', CourseViewSet) # Register your ViewSet with a prefix
router.register(r'modules', ModuleViewSet)

# Include the generated URLs in your urlpatterns
urlpatterns = router.urls