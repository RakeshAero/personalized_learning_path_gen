from collections import defaultdict
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Assessment, Question, AssessmentSubmission
from .serializers import (
    AssessmentSerializer,
    QuestionSerializer,
    AssessmentSubmissionSerializer,
    AssessmentSubmissionResultSerializer,
)
from courses.models import PersonalizedLearningPath
from courses.llm import generate_personalized_path


class AssessmentViewSet(viewsets.ModelViewSet):

    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer

    # Submit Assessment
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None): # pk = Primary Key
        assessment = self.get_object()

        # ── Guard: one submission per learner per assessment 
        if AssessmentSubmission.objects.filter(
            user=request.user, assessment=assessment
        ).exists():
            return Response(
                {"error": "You have already submitted this assessment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Validate incoming payload 
        serializer = AssessmentSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submitted_answers = serializer.validated_data['answers']

        # ── Score the assessment & compute per-skill breakdown         questions = list(assessment.questions.all())
        total = len(questions)
        total_score = 0

        # Bucket: skill_tag → [correct_count, total_count]
        skill_buckets = defaultdict(lambda: [0, 0])

        for question in questions:
            tag = question.skill_tag.strip() or "General"
            q_id_str = str(question.id)
            user_answer = submitted_answers.get(q_id_str)

            skill_buckets[tag][1] += 1           # total for this skill

            if user_answer == question.correct_answer:
                total_score += 1
                skill_buckets[tag][0] += 1       # correct for this skill

        # Convert to percentage per skill: {"Arrays": 80.0, "Trees": 20.0}
        skill_scores = {
            tag: round((correct / total_q) * 100, 1)
            for tag, (correct, total_q) in skill_buckets.items()
        }

        #  Persist the submission 
        submission = AssessmentSubmission.objects.create(
            user=request.user,
            assessment=assessment,
            score=total_score,
            skill_scores=skill_scores,
        )

        percentage = round((total_score / total) * 100) if total > 0 else 0

        #  Generate personalised learning path via LLM 
        # This runs after scoring so even if LLM fails, the score is already saved.
        path_generated = False
        try:
            # Resolve the course: onboarding assessment may link directly to course
            # or via the module's course
            if assessment.course:
                course = assessment.course
            elif assessment.module:
                course = assessment.module.course
            else:
                raise ValueError("Assessment is not linked to any course or module.")

            # Fetch every module in the course with the fields the LLM needs
            modules = list(
                course.modules
                .all()
                .order_by('order')
                .values('id', 'title', 'difficulty', 'order')
            )

            path_data = generate_personalized_path(
                course_title=course.title,
                modules=modules,
                score=total_score,
                total=total,
                skill_scores=skill_scores,
            )

            # update_or_create: one path per learner per course
            PersonalizedLearningPath.objects.update_or_create(
                user=request.user,
                course=course,
                defaults={'path_data': path_data}
            )
            path_generated = True

        except Exception as e:
            # Never let LLM errors break the submit response
            print(f"[submit] Path generation failed: {e}")

        return Response(
            {
                "score": total_score,
                "total": total,
                "percentage": percentage,
                "skill_scores": skill_scores,
                "path_generated": path_generated,
            },
            status=status.HTTP_201_CREATED,
        )

    # Check own submission 
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated], url_path='my-submission')
    def my_submission(self, request, pk=None):
        """
        GET /api/assessments/{id}/my-submission/
        Returns the current learner's submission for this assessment,
        or {"submitted": false} if they haven't submitted yet.
        """
        assessment = self.get_object()
        try:
            submission = AssessmentSubmission.objects.get(
                user=request.user, assessment=assessment
            )
            serializer = AssessmentSubmissionResultSerializer(submission)
            return Response({"submitted": True, **serializer.data})
        except AssessmentSubmission.DoesNotExist:
            return Response({"submitted": False})


class QuestionViewSet(viewsets.ModelViewSet):

    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
