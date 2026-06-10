from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from courses.models import Course, Module, CourseEnrollment
from assessments.models import Assessment, Question, AssessmentSubmission


class AssessmentSubmissionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='student1', password='password123', role='student'
        )
        self.client.force_authenticate(user=self.student)

        self.instructor = User.objects.create_user(
            username='instructor1', password='password123', role='instructor'
        )

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
        # Onboarding assessment linked directly to course
        self.assessment = Assessment.objects.create(
            course=self.course,
            title="Module 1 Assessment",
            is_onboarding=True,
        )
        self.q1 = Question.objects.create(
            assessment=self.assessment,
            question_text="What is Django?",
            option_1="Web framework",
            option_2="Database",
            option_3="Programming language",
            option_4="OS",
            correct_answer="Web framework",
            skill_tag="Basics",
        )
        self.q2 = Question.objects.create(
            assessment=self.assessment,
            question_text="Is Django written in Python?",
            option_1="Yes",
            option_2="No",
            option_3="Maybe",
            option_4="I don't know",
            correct_answer="Yes",
            skill_tag="Basics",
        )
        self.q3 = Question.objects.create(
            assessment=self.assessment,
            question_text="What is ORM?",
            option_1="Object Relational Mapper",
            option_2="Online Resource Manager",
            option_3="Old Runtime Module",
            option_4="None",
            correct_answer="Object Relational Mapper",
            skill_tag="ORM",
        )

    # ── Course Enrollment Tests ───────────────────────────────────────────────

    def test_enroll_in_course(self):
        url = f"/api/courses/{self.course.id}/enroll/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['enrolled'])
        self.assertEqual(response.data['onboarding_assessment_id'], self.assessment.id)

        # Verify DB record
        self.assertTrue(
            CourseEnrollment.objects.filter(user=self.student, course=self.course).exists()
        )

    def test_enroll_twice_returns_200(self):
        url = f"/api/courses/{self.course.id}/enroll/"
        self.client.post(url)
        response = self.client.post(url)   # second attempt
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("already enrolled", response.data['detail'])

    def test_my_enrollments(self):
        CourseEnrollment.objects.create(user=self.student, course=self.course)
        response = self.client.get("/api/enrollments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['course_id'], self.course.id)
        self.assertTrue(response.data[0]['has_onboarding'])
        self.assertFalse(response.data[0]['onboarding_submitted'])

    # ── Scoring Tests ─────────────────────────────────────────────────────────

    def test_submit_all_correct_skill_scores(self):
        url = f"/api/assessments/{self.assessment.id}/submit/"
        payload = {
            "answers": {
                str(self.q1.id): "Web framework",
                str(self.q2.id): "Yes",
                str(self.q3.id): "Object Relational Mapper",
            }
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['score'], 3)
        self.assertEqual(response.data['percentage'], 100)

        # Both skills should be 100%
        skill_scores = response.data['skill_scores']
        self.assertEqual(skill_scores.get('Basics'), 100.0)
        self.assertEqual(skill_scores.get('ORM'), 100.0)

    def test_submit_partial_skill_scores(self):
        url = f"/api/assessments/{self.assessment.id}/submit/"
        payload = {
            "answers": {
                str(self.q1.id): "Web framework",  # Basics correct
                str(self.q2.id): "No",              # Basics wrong
                str(self.q3.id): "Object Relational Mapper",  # ORM correct
            }
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['score'], 2)

        skill_scores = response.data['skill_scores']
        # Basics: 1/2 = 50%
        self.assertEqual(skill_scores.get('Basics'), 50.0)
        # ORM: 1/1 = 100%
        self.assertEqual(skill_scores.get('ORM'), 100.0)

        # Verify skill_scores persisted in DB
        submission = AssessmentSubmission.objects.get(
            user=self.student, assessment=self.assessment
        )
        self.assertEqual(submission.skill_scores.get('Basics'), 50.0)

    def test_duplicate_submission_blocked(self):
        url = f"/api/assessments/{self.assessment.id}/submit/"
        payload = {
            "answers": {
                str(self.q1.id): "Web framework",
                str(self.q2.id): "Yes",
                str(self.q3.id): "Object Relational Mapper",
            }
        }
        self.client.post(url, payload, format='json')
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already submitted", response.data['error'])

    def test_my_submission_before_and_after(self):
        # Before submission
        url = f"/api/assessments/{self.assessment.id}/my-submission/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['submitted'])

        # Submit
        self.client.post(
            f"/api/assessments/{self.assessment.id}/submit/",
            {"answers": {str(self.q1.id): "Web framework",
                         str(self.q2.id): "Yes",
                         str(self.q3.id): "Object Relational Mapper"}},
            format='json'
        )

        # After submission
        response = self.client.get(url)
        self.assertTrue(response.data['submitted'])
        self.assertIn('skill_scores', response.data)

    def test_enrollments_onboarding_submitted_flag(self):
        CourseEnrollment.objects.create(user=self.student, course=self.course)

        # Check before submitting
        response = self.client.get("/api/enrollments/")
        self.assertFalse(response.data[0]['onboarding_submitted'])

        # Submit onboarding
        self.client.post(
            f"/api/assessments/{self.assessment.id}/submit/",
            {"answers": {str(self.q1.id): "Web framework",
                         str(self.q2.id): "Yes",
                         str(self.q3.id): "Object Relational Mapper"}},
            format='json'
        )

        # Check after submitting
        response = self.client.get("/api/enrollments/")
        self.assertTrue(response.data[0]['onboarding_submitted'])
