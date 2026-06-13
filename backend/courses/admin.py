from django.contrib import admin
from .models import Course, Module, Subtopic, CourseEnrollment, PersonalizedLearningPath


class SubtopicInline(admin.TabularInline):
    model = Subtopic
    extra = 1
    fields = ('title', 'order')
    ordering = ('order',)


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0
    fields = ('title', 'difficulty', 'order', 'estimated_duration')
    ordering = ('order',)
    show_change_link = True


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'difficulty', 'order', 'estimated_duration')
    list_filter = ('difficulty', 'course')
    search_fields = ('title', 'course__title')
    ordering = ('course', 'order')
    inlines = [SubtopicInline]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'created_at')
    search_fields = ('title', 'instructor__username')
    inlines = [ModuleInline]


admin.site.register(CourseEnrollment)
admin.site.register(PersonalizedLearningPath)
