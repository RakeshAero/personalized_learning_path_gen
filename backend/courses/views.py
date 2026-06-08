from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Course, Module, PersonalizedLearningPath
from .serializers import CourseSerializer, ModuleSerializer, PersonalizedLearningPathSerializer
from .permissions import IsInstructorOrReadOnly


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_path(request):
    """
    GET /api/my-path/?course_id=<id>

    Returns the authenticated learner's personalised learning path for a course.
    If no path exists yet (learner hasn't submitted the assessment), returns
    { "has_path": false, "path_data": null }.
    """
    course_id = request.query_params.get('course_id')

    if not course_id:
        return Response(
            {'error': 'course_id query param is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        path = PersonalizedLearningPath.objects.get(
            user=request.user,
            course_id=course_id
        )
        serializer = PersonalizedLearningPathSerializer(path)
        return Response({
            'has_path': True,
            **serializer.data
        })

    except PersonalizedLearningPath.DoesNotExist:
        return Response({
            'has_path': False,
            'path_data': None,
            'created_at': None,
        })
