from django.contrib import admin
from .models import Assessment, Question, AssessmentSubmission


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('question_text', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_answer', 'difficulty', 'skill_tag')


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'module', 'is_onboarding', 'question_count', 'created_at')
    list_filter = ('is_onboarding', 'course')
    search_fields = ('title', 'course__title')
    inlines = [QuestionInline]

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'assessment', 'skill_tag', 'difficulty', 'correct_answer')
    list_filter = ('difficulty', 'skill_tag', 'assessment')
    search_fields = ('question_text', 'assessment__title')


admin.site.register(AssessmentSubmission)
