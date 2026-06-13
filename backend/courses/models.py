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

    # Cached LLM-generated welcome/intro markdown (generated once, reused)
    intro_content = models.TextField(blank=True, default='')

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


# Course Enrollment Table — tracks which learner joined which course
class CourseEnrollment(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        #UNIQUE(user_id, course_id)
        unique_together = ('user', 'course')  # One user can have only one personalized learning path per course.

    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title}"


class Subtopic(models.Model):
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name='subtopics'
    )
    title = models.CharField(max_length=255)
    content = models.JSONField(default=list, blank=True)  # stores list of {"type": "header"|"paragraph", "value": "text"}
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"
