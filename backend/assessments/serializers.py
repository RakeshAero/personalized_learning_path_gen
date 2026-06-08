from rest_framework import serializers
from .models import Assessment, Question


class QuestionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Question
        fields = [
            "id",
            "question_text",
            "option_1",
            "option_2",
            "option_3",
            "option_4",
            "correct_answer",
            "difficulty",
        ]


class AssessmentSerializer(serializers.ModelSerializer):

    questions = QuestionSerializer(many=True, read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'module', 'module_title', 'title', 'created_at', 'questions']


class AssessmentSubmissionSerializer(serializers.Serializer):
    answers = serializers.DictField(
        child=serializers.CharField(),
        help_text="A dictionary mapping question ID (as string) to the selected answer."
    )
