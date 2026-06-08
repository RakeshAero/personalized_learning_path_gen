from django.db import models
from users.models import User

# Course Table
class Course(models.Model):
    title = models.CharField(max_length=255) #varchar(255)

    description = models.TextField()

    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='courses'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__ (self):
        return self.title
    

# Module Table

class Module(models.Model):
    DIFFICULTY_CHOICE = (
        ('easy','Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='modules'
    )

    title = models.CharField(max_length=255)

    description = models.TextField()

    content = models.TextField()

    estimated_duration = models.IntegerField(
        help_text="Duration in minutes"   #similar to placeholder
    )

    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICE,
        default='easy'
    )

    order = models.IntegerField()

    def __str__(self):
        return self.title

# Personalized Learning Path Table
class PersonalizedLearningPath(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='learning_paths'
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='learning_paths'
    )

    path_data = models.JSONField()  # LLM-returned ordered list
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')  # Ensure one path per user-course pair

    def __str__(self):
        return f"{self.user.username}'s Learning Path for {self.course.title}"