from django.db import models
from courses.models import Module, Course


# Maps to Assessment Table
class Assessment(models.Model):
    # Linked to a module (optional — onboarding assessments link to the whole course)
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='assessments',
        null=True,
        blank=True,
    )

    # Direct course link for onboarding assessments
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='onboarding_assessments',
        null=True,
        blank=True,
    )

    title = models.CharField(max_length=255)

    # Marks this as the entry-gate assessment for a course
    is_onboarding = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# Maps to Question Table
class Question(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    question_text = models.TextField()

    option_1 = models.CharField(max_length=255)
    option_2 = models.CharField(max_length=255)
    option_3 = models.CharField(max_length=255)
    option_4 = models.CharField(max_length=255)

    correct_answer = models.CharField(max_length=255)

    difficulty = models.CharField(
        max_length=20,
        default='easy'
    )

    # Skill domain this question tests (e.g. "Arrays", "Trees", "Sorting")
    skill_tag = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return self.question_text


class AssessmentSubmission(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    score = models.IntegerField()

    # Per-skill breakdown: {"Arrays": 80.0, "Trees": 20.0, "Sorting": 100.0}
    skill_scores = models.JSONField(default=dict)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One submission per learner per assessment
        unique_together = ('user', 'assessment')

    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} - Score: {self.score}"
