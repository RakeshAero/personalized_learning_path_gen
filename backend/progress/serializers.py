from rest_framework import serializers
from .models import Progress


class ProgressSerializer(serializers.ModelSerializer):
    module_title = serializers.CharField(source='module.title', read_only=True)
    course_id = serializers.IntegerField(source='module.course.id', read_only=True)

    class Meta:
        model = Progress
        fields = ['id', 'module', 'module_title', 'course_id', 'completed', 'score', 'updated_at']
        read_only_fields = ['user', 'updated_at']
