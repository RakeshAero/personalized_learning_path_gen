from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from courses.models import Course, Module
from assessments.models import Assessment, Question, AssessmentSubmission

class AssessmentSubmissionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='student1', password='password123', role='student')
        self.client.force_authenticate(user=self.user)
        
        self.instructor = User.objects.create_user(username='instructor1', password='password123', role='instructor')
        
        self.course = Course.objects.create(
            title="Django Basics",
            description="Learn Django",
            instructor=self.instructor
        )
        self.module = Module.objects.create(
            course=self.course,
            title="Introduction to Django",
            description="Overview",
            content="Some content",
            estimated_duration=30,
            difficulty='easy',
            order=1
        )
        self.assessment = Assessment.objects.create(
            module=self.module,
            title="Module 1 Assessment"
        )
        self.q1 = Question.objects.create(
            assessment=self.assessment,
            question_text="What is Django?",
            option_1="Web framework",
            option_2="Database",
            option_3="Programming language",
            option_4="OS",
            correct_answer="Web framework"
        )
        self.q2 = Question.objects.create(
            assessment=self.assessment,
            question_text="Is Django written in Python?",
            option_1="Yes",
            option_2="No",
            option_3="Maybe",
            option_4="I don't know",
            correct_answer="Yes"
        )

    def test_submit_assessment_correct_score(self):
        url = f"/api/assessments/{self.assessment.id}/submit/"
        
        # Test 1: Submit correct answers
        payload = {
            "answers": {
                str(self.q1.id): "Web framework",
                str(self.q2.id): "Yes"
            }
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['score'], 2)
        
        # Verify stored submission in database
        submission = AssessmentSubmission.objects.filter(user=self.user, assessment=self.assessment).first()
        self.assertIsNotNone(submission)
        self.assertEqual(submission.score, 2)

    def test_submit_assessment_partial_score(self):
        url = f"/api/assessments/{self.assessment.id}/submit/"
        
        # Test 2: Submit partially correct answers
        payload = {
            "answers": {
                str(self.q1.id): "Web framework",
                str(self.q2.id): "No"
            }
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['score'], 1)
