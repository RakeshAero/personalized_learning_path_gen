from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Assessment, Question, AssessmentSubmission
from .serializers import AssessmentSerializer, QuestionSerializer, AssessmentSubmissionSerializer


class AssessmentViewSet(viewsets.ModelViewSet):

    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        assessment = self.get_object()
        serializer = AssessmentSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submitted_answers = serializer.validated_data['answers']

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

        return Response({"score": score}, status=status.HTTP_201_CREATED)


class QuestionViewSet(viewsets.ModelViewSet):

    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
