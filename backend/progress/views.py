from collections import defaultdict
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Progress, SubtopicProgress
from .serializers import ProgressSerializer
from courses.models import Module, Subtopic, CourseEnrollment


class ProgressViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # GET /api/progress/ — all progress for the current user
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

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        GET /api/progress/analytics/?course_id=<id>  (instructor/admin only)

        Returns:
          - completion_rate      : % of enrolled learners who completed every subtopic
          - drop_off_module      : module title where most learners stopped progressing
          - avg_completion_pct   : average % of subtopics completed across all enrolled learners
          - total_enrolled       : number of active enrolments
          - total_completed      : number of learners who finished all subtopics
          - per_learner          : per-learner breakdown (name, completed, total, pct, last_active)
        """
        if request.user.role not in ('instructor', 'admin'):
            return Response({'error': 'Instructor or admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'course_id query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # All subtopics in this course, grouped by module
        subtopics = (
            Subtopic.objects
            .filter(module__course_id=course_id)
            .select_related('module')
            .order_by('module__order', 'order')
        )
        total_subtopics = subtopics.count()
        if total_subtopics == 0:
            return Response({
                'completion_rate': 0,
                'drop_off_module': None,
                'avg_completion_pct': 0,
                'total_enrolled': 0,
                'total_completed': 0,
                'per_learner': [],
            })

        subtopic_ids = [s.id for s in subtopics]
        # Map subtopic_id → module title (for drop-off detection)
        subtopic_to_module = {s.id: s.module.title for s in subtopics}

        # All active enrolments for this course
        enrollments = CourseEnrollment.objects.filter(
            course_id=course_id, is_active=True
        ).select_related('user')

        total_enrolled = enrollments.count()
        if total_enrolled == 0:
            return Response({
                'completion_rate': 0,
                'drop_off_module': None,
                'avg_completion_pct': 0,
                'total_enrolled': 0,
                'total_completed': 0,
                'per_learner': [],
            })

        learner_ids = [e.user_id for e in enrollments]
        learner_map = {e.user_id: e.user for e in enrollments}

        # All subtopic progress rows for these learners in this course
        all_progress = SubtopicProgress.objects.filter(
            user_id__in=learner_ids,
            subtopic_id__in=subtopic_ids,
            completed=True,
        ).order_by('updated_at')

        # Build per-learner sets of completed subtopic IDs
        learner_completed = defaultdict(set)
        learner_last_active = {}
        for p in all_progress:
            learner_completed[p.user_id].add(p.subtopic_id)
            learner_last_active[p.user_id] = p.updated_at

        # Per-learner stats + drop-off detection
        total_completed = 0
        completion_pcts = []
        # module_title → count of learners whose last touched subtopic belongs to that module
        drop_off_counts = defaultdict(int)

        per_learner = []
        for uid, user in learner_map.items():
            done = learner_completed.get(uid, set())
            pct = round((len(done) / total_subtopics) * 100)
            is_finished = len(done) == total_subtopics
            if is_finished:
                total_completed += 1
            completion_pcts.append(pct)

            # Drop-off: find the last subtopic this learner completed
            learner_done_progress = [
                p for p in all_progress if p.user_id == uid
            ]
            if learner_done_progress and not is_finished:
                last_sub_id = learner_done_progress[-1].subtopic_id
                drop_off_counts[subtopic_to_module[last_sub_id]] += 1

            per_learner.append({
                'username': user.username,
                'completed_subtopics': len(done),
                'total_subtopics': total_subtopics,
                'completion_pct': pct,
                'finished': is_finished,
                'last_active': learner_last_active.get(uid),
            })

        avg_completion_pct = round(sum(completion_pcts) / len(completion_pcts)) if completion_pcts else 0
        completion_rate = round((total_completed / total_enrolled) * 100) if total_enrolled else 0

        drop_off_module = None
        if drop_off_counts:
            drop_off_module = max(drop_off_counts, key=drop_off_counts.get)

        return Response({
            'completion_rate': completion_rate,
            'drop_off_module': drop_off_module,
            'avg_completion_pct': avg_completion_pct,
            'total_enrolled': total_enrolled,
            'total_completed': total_completed,
            'per_learner': sorted(per_learner, key=lambda x: -x['completion_pct']),
        })


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
