from rest_framework import serializers
from .models import Course, Module, PersonalizedLearningPath, CourseEnrollment


class ModuleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Module
        fields = '__all__'

    # Validate estimated_duration
    def validate_estimated_duration(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0")
        return value


class CourseSerializer(serializers.ModelSerializer):

    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ['instructor']

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Title too short")
        return value


class PersonalizedLearningPathSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = PersonalizedLearningPath
        fields = ['id', 'course', 'course_title', 'path_data', 'created_at']
        read_only_fields = ['user', 'created_at']


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_description = serializers.CharField(source='course.description', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'course', 'course_title', 'course_description', 'enrolled_at', 'is_active']
        read_only_fields = ['user', 'enrolled_at']
