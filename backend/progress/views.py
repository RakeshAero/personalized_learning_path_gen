from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Progress, SubtopicProgress
from .serializers import ProgressSerializer
from courses.models import Module, Subtopic


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


class SubtopicProgressViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        course_id = request.query_params.get('course_id')
        if course_id:
            progress = SubtopicProgress.objects.filter(
                user=request.user,
                subtopic__module__course_id=course_id
            )
        else:
            progress = SubtopicProgress.objects.filter(user=request.user)

        data = [
            {
                "subtopic_id": p.subtopic_id,
                "completed": p.completed,
                "updated_at": p.updated_at
            } for p in progress
        ]
        return Response(data)

    @action(detail=False, methods=['post'])
    def complete(self, request):
        subtopic_id = request.data.get('subtopic_id')
        if not subtopic_id:
            return Response({'error': 'subtopic_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        subtopic = get_object_or_404(Subtopic, id=subtopic_id)

        progress, _ = SubtopicProgress.objects.get_or_create(
            user=request.user,
            subtopic=subtopic,
        )
        progress.completed = True
        progress.save()

        return Response({
            "subtopic_id": progress.subtopic_id,
            "completed": progress.completed,
            "updated_at": progress.updated_at
        }, status=status.HTTP_200_OK)

