from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Assessment, Question, AssessmentSubmission
from .serializers import AssessmentSerializer, QuestionSerializer, AssessmentSubmissionSerializer
from courses.models import PersonalizedLearningPath
from courses.llm import generate_personalized_path


class AssessmentViewSet(viewsets.ModelViewSet):

    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        assessment = self.get_object()
        serializer = AssessmentSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submitted_answers = serializer.validated_data['answers']

        # ── Score the assessment ────────────────────────────────────────────
        questions = assessment.questions.all()
        score = 0

        for question in questions:
            q_id_str = str(question.id)
            user_answer = submitted_answers.get(q_id_str)
            if user_answer == question.correct_answer:
                score += 1

        AssessmentSubmission.objects.create(
            user=request.user,
            assessment=assessment,
            score=score
        )

        total = questions.count()

        # ── Generate personalised learning path via LLM ─────────────────────
        # This runs after scoring so even if it fails the score is already saved.
        try:
            course = assessment.module.course

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
                score=score,
                total=total,
            )

            # update_or_create: one path per learner per course
            PersonalizedLearningPath.objects.update_or_create(
                user=request.user,
                course=course,
                defaults={'path_data': path_data}
            )

        except Exception as e:
            # Never let LLM errors break the submit response
            print(f"[submit] Path generation failed: {e}")

        return Response(
            {
                "score": score,
                "total": total,
                "percentage": round((score / total) * 100) if total > 0 else 0,
                "path_generated": True,
            },
            status=status.HTTP_201_CREATED,
        )


class QuestionViewSet(viewsets.ModelViewSet):

    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
