from django.contrib import admin
from .models import Course, Module, CourseEnrollment, PersonalizedLearningPath

admin.site.register(Course)
admin.site.register(Module)
admin.site.register(CourseEnrollment)
admin.site.register(PersonalizedLearningPath)