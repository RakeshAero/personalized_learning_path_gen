from rest_framework import serializers
from .models import Course, Module

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

    modules = ModuleSerializer(many=True, read_only=True)  # Join Module Table to Get the Course & Module, One to Many Relationship

    class Meta:            # meta data or configuration
        model = Course     # telling django to map Map course model
        fields = '__all__'  # Fields that include in while returning
        read_only_fields = ['instructor']  # Frontend cannot manually set instructor

    # Validate the title field for Course 
    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Title too short")

        return value



