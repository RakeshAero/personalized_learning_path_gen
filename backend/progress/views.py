from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Progress
from .serializers import ProgressSerializer
from courses.models import Module


class ProgressViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /api/progress/ — all progress for the current user"""
        progress = Progress.objects.filter(user=request.user).select_related('module', 'module__course')
        serializer = ProgressSerializer(progress, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def complete(self, request):
        """POST /api/progress/complete/ — mark a module as complete"""
        module_id = request.data.get('module_id')
        if not module_id:
            return Response({'error': 'module_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        module = get_object_or_404(Module, id=module_id)

        progress, _ = Progress.objects.get_or_create(
            user=request.user,
            module=module,
        )
        progress.completed = True
        progress.save()

        serializer = ProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def course(self, request):
        """GET /api/progress/course/?course_id=<id> — progress for all modules in a course"""
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id query param is required'}, status=status.HTTP_400_BAD_REQUEST)

        progress = Progress.objects.filter(
            user=request.user,
            module__course_id=course_id
        ).select_related('module', 'module__course')

        serializer = ProgressSerializer(progress, many=True)
        return Response(serializer.data)
