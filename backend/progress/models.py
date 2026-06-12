from django.db import models
from users.models import User
from courses.models import Module, Subtopic

class Progress(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE
    )

    completed = models.BooleanField(default=False)

    score = models.FloatField(default=0)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.module.title}"


class SubtopicProgress(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='subtopic_progress'
    )
    subtopic = models.ForeignKey(
        Subtopic,
        on_delete=models.CASCADE,
        related_name='progress'
    )
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'subtopic')

    def __str__(self):
        return f"{self.user.username} - {self.subtopic.title} - {self.completed}"

