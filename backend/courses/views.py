from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from .models import Course, Module, PersonalizedLearningPath, CourseEnrollment
from .serializers import (
    CourseSerializer,
    ModuleSerializer,
    PersonalizedLearningPathSerializer,
    CourseEnrollmentSerializer,
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


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer


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

    result = []
    for enrollment in enrollments:
        course = enrollment.course
        onboarding = course.onboarding_assessments.filter(is_onboarding=True).first()

        has_onboarding = onboarding is not None
        onboarding_submitted = False
        if has_onboarding:
            from assessments.models import AssessmentSubmission
            onboarding_submitted = AssessmentSubmission.objects.filter(
                user=request.user,
                assessment=onboarding
            ).exists()

        result.append({
            "enrollment_id": enrollment.id,
            "course_id": course.id,
            "course_title": course.title,
            "course_description": course.description,
            "enrolled_at": enrollment.enrolled_at,
            "has_onboarding": has_onboarding,
            "onboarding_assessment_id": onboarding.id if onboarding else None,
            "onboarding_submitted": onboarding_submitted,
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
