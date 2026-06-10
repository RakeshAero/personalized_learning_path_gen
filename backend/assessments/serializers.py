from rest_framework import serializers
from .models import Assessment, Question, AssessmentSubmission


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
            "skill_tag",
        ]


class AssessmentSerializer(serializers.ModelSerializer):

    questions = QuestionSerializer(many=True, read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Assessment
        fields = [
            'id',
            'module',
            'module_title',
            'course',
            'course_title',
            'title',
            'is_onboarding',
            'created_at',
            'questions',
        ]


class AssessmentSubmissionSerializer(serializers.Serializer):
    """Accepts the learner's submitted answers dict."""
    answers = serializers.DictField(
        child=serializers.CharField(),
        help_text="A dictionary mapping question ID (as string) to the selected answer."
    )


class AssessmentSubmissionResultSerializer(serializers.ModelSerializer):
    """Read serializer for returning submission details."""

    class Meta:
        model = AssessmentSubmission
        fields = ['id', 'assessment', 'score', 'skill_scores', 'submitted_at']
