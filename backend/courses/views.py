from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Max
from .models import Course, Module, PersonalizedLearningPath, CourseEnrollment, Subtopic
from .serializers import (
    CourseSerializer,
    ModuleSerializer,
    PersonalizedLearningPathSerializer,
    CourseEnrollmentSerializer,
    SubtopicSerializer,
)
from .permissions import IsInstructorOrReadOnly


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    # ── Enroll in a Course ───────────────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """
        POST /api/courses/{id}/enroll/
        Enrolls the authenticated learner in a course.
        Returns enrollment details + onboarding assessment ID if one exists.
        """
        course = self.get_object()

        # Guard: already enrolled
        if CourseEnrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {"detail": "You are already enrolled in this course."},
                status=status.HTTP_200_OK,
            )

        enrollment = CourseEnrollment.objects.create(
            user=request.user,
            course=course,
        )

        # Check if this course has an onboarding assessment
        onboarding = course.onboarding_assessments.filter(is_onboarding=True).first()

        return Response(
            {
                "enrolled": True,
                "course_id": course.id,
                "course_title": course.title,
                "onboarding_assessment_id": onboarding.id if onboarding else None,
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Get Onboarding Assessment for a Course ───────────────────────────────
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def onboarding_assessment(self, request, pk=None):
        """
        GET /api/courses/{id}/onboarding-assessment/
        Returns the onboarding assessment for this course (if any).
        """
        course = self.get_object()
        onboarding = course.onboarding_assessments.filter(is_onboarding=True).first()

        if not onboarding:
            return Response(
                {"detail": "No onboarding assessment found for this course."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "assessment_id": onboarding.id,
            "title": onboarding.title,
            "question_count": onboarding.questions.count(),
        })

    # ── Regenerate Personalised Path ─────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='regenerate-path', permission_classes=[IsAuthenticated])
    def regenerate_path(self, request, pk=None):
        """
        POST /api/courses/{id}/regenerate-path/
        Re-runs the LLM path generator using the learner's existing onboarding
        skill scores — no need to retake the assessment.
        """
        course = self.get_object()
        onboarding = course.onboarding_assessments.filter(is_onboarding=True).first()
        if not onboarding:
            return Response(
                {'error': 'This course has no onboarding assessment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from assessments.models import AssessmentSubmission
        try:
            submission = AssessmentSubmission.objects.get(
                user=request.user, assessment=onboarding
            )
        except AssessmentSubmission.DoesNotExist:
            return Response(
                {'error': 'Complete the onboarding assessment before regenerating your path.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        modules = list(
            course.modules.all().order_by('order').values('id', 'title', 'difficulty', 'order')
        )

        from .llm import generate_personalized_path
        path_data = generate_personalized_path(
            course_title=course.title,
            modules=modules,
            score=submission.score,
            total=onboarding.questions.count(),
            skill_scores=submission.skill_scores,
        )

        PersonalizedLearningPath.objects.update_or_create(
            user=request.user,
            course=course,
            defaults={'path_data': path_data},
        )

        return Response({'regenerated': True, 'path_data': path_data}, status=status.HTTP_200_OK)

    # ── Get dynamic intro for a Course ─────────────────────────────────────────
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def intro(self, request, pk=None):
        """
        GET /api/courses/{id}/intro/
        Returns the welcoming note and upcoming modules list.

        The LLM-generated intro is cached on the course after the first
        generation, so we don't pay an LLM call (and a multi-second wait)
        on every page load. Pass ?refresh=true to regenerate it — useful
        after modules change.
        """
        course = self.get_object()
        refresh = request.query_params.get('refresh') == 'true'

        if course.intro_content and not refresh:
            return Response({"intro_content": course.intro_content})

        from .llm import generate_course_intro_overview
        modules = course.modules.all().order_by('order')
        intro_content = generate_course_intro_overview(
            course.title, course.description, modules
        )

        # Persist so subsequent loads are instant
        course.intro_content = intro_content
        course.save(update_fields=['intro_content'])

        return Response({"intro_content": intro_content})

    # ── AI Curriculum Generator ──────────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsInstructorOrReadOnly])
    def generate_curriculum(self, request, pk=None):
        """
        POST /api/courses/{id}/generate-curriculum/
        Body: {"num_modules": int, "target_audience": str}
        Calls Gemini to build a full curriculum preview (modules + assessment).
        Does NOT write to DB — the instructor reviews and confirms via save-curriculum.
        """
        course = self.get_object()
        num_modules = int(request.data.get('num_modules', 4))
        target_audience = request.data.get('target_audience', 'general learners')

        num_modules = max(1, min(num_modules, 10))  # clamp 1-10

        from .llm import generate_curriculum
        result = generate_curriculum(
            course.title,
            course.description,
            num_modules,
            target_audience,
        )

        if result is None:
            return Response(
                {"error": "AI generation failed. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='save-curriculum',
            permission_classes=[IsAuthenticated, IsInstructorOrReadOnly])
    def save_curriculum(self, request, pk=None):
        """
        POST /api/courses/{id}/save-curriculum/
        Body: same shape as generate-curriculum response.
        Saves modules, subtopics, and onboarding assessment+questions in one transaction.
        """
        course = self.get_object()
        modules_data = request.data.get('modules', [])
        assessment_data = request.data.get('onboarding_assessment', {})

        if not modules_data:
            return Response({"error": "No modules provided."}, status=status.HTTP_400_BAD_REQUEST)

        from assessments.models import Assessment, Question

        try:
            with transaction.atomic():
                # Determine starting order (append after existing modules)
                existing_max = course.modules.aggregate(max_order=Max('order'))['max_order'] or 0

                created_modules = []
                for i, m in enumerate(modules_data):
                    module = Module.objects.create(
                        course=course,
                        title=m.get('title', f'Module {i+1}'),
                        description=m.get('description', ''),
                        content=m.get('content', ''),
                        difficulty=m.get('difficulty', 'easy'),
                        order=existing_max + m.get('order', i + 1),
                        estimated_duration=m.get('estimated_duration', 60),
                    )
                    for j, st in enumerate(m.get('subtopics', [])):
                        Subtopic.objects.create(
                            module=module,
                            title=st.get('title', f'Subtopic {j+1}'),
                            order=st.get('order', j + 1),
                        )
                    created_modules.append(module.id)

                # Replace any existing onboarding assessment so there is always
                # exactly one — prevents .first() returning a stale empty one.
                assessment_id = None
                if assessment_data and assessment_data.get('questions'):
                    Assessment.objects.filter(course=course, is_onboarding=True).delete()
                    assessment = Assessment.objects.create(
                        course=course,
                        title=assessment_data.get('title', f'{course.title} — Knowledge Check'),
                        is_onboarding=True,
                    )
                    assessment_id = assessment.id
                    for q in assessment_data.get('questions', []):
                        Question.objects.create(
                            assessment=assessment,
                            question_text=q.get('question_text', ''),
                            option_1=q.get('option_1', ''),
                            option_2=q.get('option_2', ''),
                            option_3=q.get('option_3', ''),
                            option_4=q.get('option_4', ''),
                            correct_answer=q.get('correct_answer', ''),
                            difficulty=q.get('difficulty', 'easy'),
                            skill_tag=q.get('skill_tag', ''),
                        )

                # Bust cached intro so it regenerates with new modules
                course.intro_content = ''
                course.save(update_fields=['intro_content'])

        except Exception as e:
            return Response(
                {"error": f"Failed to save curriculum: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            "saved": True,
            "modules_created": len(created_modules),
            "assessment_id": assessment_id,
        }, status=status.HTTP_201_CREATED)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer


class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.all()
    serializer_class = SubtopicSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]



# ── Learner's enrolled courses ────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_enrollments(request):
    """
    GET /api/enrollments/
    Returns all courses the authenticated learner is enrolled in,
    along with whether an onboarding assessment exists and if they've completed it.
    """
    enrollments = CourseEnrollment.objects.filter(
        user=request.user, is_active=True
    ).select_related('course')

    from assessments.models import AssessmentSubmission
    from progress.models import SubtopicProgress
    from .models import Subtopic

    result = []
    for enrollment in enrollments:
        course = enrollment.course
        onboarding = course.onboarding_assessments.filter(is_onboarding=True).first()

        has_onboarding = onboarding is not None
        onboarding_submitted = False
        if has_onboarding:
            onboarding_submitted = AssessmentSubmission.objects.filter(
                user=request.user,
                assessment=onboarding
            ).exists()

        total_subtopics = Subtopic.objects.filter(module__course=course).count()
        completed_subtopics = SubtopicProgress.objects.filter(
            user=request.user,
            subtopic__module__course=course,
            completed=True
        ).count()
        completion_pct = round((completed_subtopics / total_subtopics) * 100) if total_subtopics > 0 else 0

        result.append({
            "enrollment_id": enrollment.id,
            "course_id": course.id,
            "course_title": course.title,
            "course_description": course.description,
            "enrolled_at": enrollment.enrolled_at,
            "has_onboarding": has_onboarding,
            "onboarding_assessment_id": onboarding.id if onboarding else None,
            "onboarding_submitted": onboarding_submitted,
            "total_subtopics": total_subtopics,
            "completed_subtopics": completed_subtopics,
            "completion_pct": completion_pct,
        })

    return Response(result)


# ── Learner's personalised path for a course ──────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_path(request):
    """
    GET /api/my-path/?course_id=<id>
    Returns the authenticated learner's personalised learning path for a course.
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
