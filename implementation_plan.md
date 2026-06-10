# Module 3: Learner Onboarding & Assessment Engine

## Background & Current State

After a full codebase review, here's what exists and what's missing:

### ✅ What Already Works (Modules 1 & 2)
| Feature | File |
|---|---|
| JWT Auth + refresh + role guards | `users/`, `routes/` |
| Course + Module CRUD (Instructor only) | `courses/models.py`, `courses/views.py` |
| MCQ Assessment + Question creation | `assessments/models.py` |
| Assessment submission → score → LLM path | `assessments/views.py`, `courses/llm.py` |
| Module progress tracking | `progress/models.py`, `progress/views.py` |
| PersonalizedLearningPath stored in DB | `courses/models.py` |

### ❌ What's Missing for Module 3

| Gap | Impact |
|---|---|
| No `skill_tag` on `Question` model | Can't tag scores by domain (Arrays, Trees, etc.) |
| No per-skill score breakdown in `AssessmentSubmission` | Requirement 2 entirely unmet |
| No `CourseEnrollment` model | Learner can't "join" a course (Requirement 1) |
| No `is_onboarding` flag on `Assessment` | Can't identify which assessment is the onboarding gate |
| No enroll API endpoint | Frontend has no way to trigger enrollment |
| No frontend enrollment flow | Learner has no "Join Course" → assessment → result UX |
| LLM path uses only total score, not skill tags | Path is less precise than it could be |

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Skill Tag source of truth**: Should `skill_tag` be a free-text CharField on `Question` (e.g., type "Arrays") or a predefined `SkillTag` model that admin manages? A free-text field is simpler to build now; a FK model would power the analytics in Module 6. **Recommendation: free-text CharField now** (easy to migrate later).

> [!IMPORTANT]
> **Q2 — One onboarding assessment per course?**: Currently `Assessment` is tied to a `Module`, not a `Course`. For onboarding, it makes more sense to link the assessment to the whole course. **Recommendation: Add `course` FK + `is_onboarding` bool to Assessment, keeping the existing `module` FK optional/nullable for backward compat.**

> [!IMPORTANT]
> **Q3 — Re-attempt policy**: Can a learner retake the onboarding assessment? For now plan is to block retakes (one submission per learner per onboarding assessment). Should this be configurable?

---

## Proposed Changes

---

### Backend — `assessments` app

#### [MODIFY] [models.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/assessments/models.py)
- Add `skill_tag = CharField(max_length=100, blank=True)` to `Question`
- Add `course = FK(Course, null=True, blank=True, related_name='onboarding_assessments')` to `Assessment`
- Add `is_onboarding = BooleanField(default=False)` to `Assessment`
- Add `skill_scores = JSONField(default=dict)` to `AssessmentSubmission` (stores `{"Arrays": 80.0, "Trees": 20.0}`)
- Add `unique_together = ('user', 'assessment')` to `AssessmentSubmission` to prevent duplicate submissions

#### [MODIFY] [serializers.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/assessments/serializers.py)
- Add `skill_tag` to `QuestionSerializer`
- Add `course`, `is_onboarding` to `AssessmentSerializer`
- Add `skill_scores` to a new `AssessmentSubmissionResultSerializer` (for the submit response)

#### [MODIFY] [views.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/assessments/views.py)
- Update `submit` action to:
  1. Check if learner already submitted (guard duplicate submission)
  2. Compute **per-skill scores** by grouping questions by `skill_tag`
  3. Save `skill_scores` dict into `AssessmentSubmission`
  4. Pass `skill_scores` into `generate_personalized_path` for richer LLM context
  5. Return `skill_scores` in the response alongside total score
- Add a new `@action`: `GET assessments/{id}/my-submission/` — learner can check if they already submitted

#### [NEW] Migration
- `0003_question_skill_tag_assessment_onboarding.py`
- `0004_assessmentsubmission_skill_scores.py`

---

### Backend — `courses` app

#### [NEW] [models.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/courses/models.py) — `CourseEnrollment`
```python
class CourseEnrollment(models.Model):
    user    = FK(User, related_name='enrollments')
    course  = FK(Course, related_name='enrollments')
    enrolled_at = DateTimeField(auto_now_add=True)
    is_active   = BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'course')  # one enrollment per learner per course
```

#### [MODIFY] [serializers.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/courses/serializers.py)
- Add `CourseEnrollmentSerializer`

#### [MODIFY] [views.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/courses/views.py)
- Add `POST /api/courses/{id}/enroll/` custom action on `CourseViewSet`
  - Creates `CourseEnrollment`, returns enrollment status + onboarding assessment ID if one exists
- Add `GET /api/courses/{id}/onboarding-assessment/` — returns the onboarding assessment for that course (for the frontend to know where to redirect)
- Add `GET /api/enrollments/` — learner's enrolled courses list

#### [MODIFY] [llm.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/courses/llm.py)
- Update `generate_personalized_path` signature to accept optional `skill_scores` dict
- Enrich the LLM prompt with per-skill percentages for much more targeted path generation

#### [NEW] Migration
- `0003_courseenrollment.py`

---

### Backend — `assessments/urls.py`

#### [MODIFY] [urls.py](file:///d:/Rakesh/django_project/custom_course_creator/backend/assessments/urls.py)
- Router already picks up the new actions automatically (DRF router handles `@action` decorators)

---

### Frontend — New Pages

#### [NEW] `src/pages/TakeOnboardingAssessment.jsx`
- Learner lands here after enrolling
- Loads the onboarding assessment for that course
- Renders MCQ questions (reuses existing question rendering logic)
- On submit: shows **skill domain breakdown** result card (e.g., "Arrays: 80% ✅  Trees: 20% ⚠️")
- Shows "View Your Personalized Path →" button after completion

#### [NEW] `src/pages/LearnerDashboard.jsx`
- Shows enrolled courses with progress bars
- Shows "Take Onboarding Assessment" badge on courses where not yet taken
- Shows "Continue Learning" for courses with existing path

#### [NEW] `src/pages/SkillResult.jsx`
- Assessment completed view with rich skill breakdown visualization
- Animated skill bars per domain
- AI-generated path summary preview

---

### Frontend — Modified Pages

#### [MODIFY] [Courses.jsx](file:///d:/Rakesh/django_project/custom_course_creator/frontend/src/pages/Courses.jsx)
- Add **"Enroll"** button to each course card
- Show "Enrolled ✓" badge if already enrolled
- On enroll → redirect to onboarding assessment (if one exists) or course modules

#### [MODIFY] [App.jsx](file:///d:/Rakesh/django_project/custom_course_creator/frontend/src/App.jsx)
- Register new routes:
  - `/onboarding/:courseId` → `TakeOnboardingAssessment`
  - `/learner-dashboard` → `LearnerDashboard`
  - `/skill-result/:assessmentId` → `SkillResult`

#### [MODIFY] [CreateQuestion.jsx](file:///d:/Rakesh/django_project/custom_course_creator/frontend/src/pages/CreateQuestion.jsx)
- Add **Skill Tag** input field so instructors can tag each question with a domain (e.g., "Arrays", "Trees", "Sorting")

#### [MODIFY] [CreateAssessment.jsx](file:///d:/Rakesh/django_project/custom_course_creator/frontend/src/pages/CreateAssessment.jsx)
- Add **Course** dropdown + **"Mark as Onboarding Assessment"** toggle

---

## Data Flow After Module 3

```
Learner visits /courses
  → clicks "Enroll" on a course
  → POST /api/courses/{id}/enroll/
  → redirected to /onboarding/{courseId}
  → loads onboarding assessment questions
  → submits answers → POST /api/assessments/{id}/submit/
  → backend computes total score + skill_scores
  → LLM called with richer context → path stored
  → redirected to /skill-result/{assessmentId}
  → sees: "Arrays: 80%, Trees: 20%" breakdown
  → "View My Learning Path" → /courses/{id} (personalized order)
```

---

## DB Schema After Changes

```
Question: + skill_tag (CharField)
Assessment: + course (FK, nullable), + is_onboarding (bool)
AssessmentSubmission: + skill_scores (JSONField)  e.g. {"Arrays": 80.0, "Trees": 20.0}
CourseEnrollment: [NEW] user, course, enrolled_at, is_active
```

---

## Verification Plan

### Automated Tests (Backend)
- Extend `assessments/tests.py`:
  - Test skill score computation (questions with skill_tags → correct breakdown)
  - Test duplicate submission blocked (second submit returns 400)
  - Test `CourseEnrollment` unique constraint

### Manual Verification
- Instructor creates a course → marks one assessment as "onboarding" → adds questions with skill tags
- Learner enrolls → taken to onboarding assessment → submits → sees skill breakdown
- Check DB: `AssessmentSubmission.skill_scores` has domain percentages
- Check `PersonalizedLearningPath` was created with the richer skill context
