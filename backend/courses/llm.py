import json
from google import genai
from google.genai import types
from django.conf import settings


def _client():
    """Build a Gemini client from the configured API key."""
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def generate_personalized_path(course_title, modules, score, total, skill_scores=None):
    """
    Calls Google Gemini to reorder course modules into a personalized
    learning path based on the learner's onboarding assessment result.

    Args:
        course_title (str): Name of the course.
        modules (list): [{"id": int, "title": str, "difficulty": str, "order": int}, ...]
        score (int): Number of correct answers.
        total (int): Total number of questions.
        skill_scores (dict, optional): Per-skill percentages e.g. {"Arrays": 80.0, "Trees": 20.0}

    Returns:
        list: [{"module_id": int, "title": str, "skip": bool, "reason": str}, ...]
        Falls back to default module order if the LLM call fails.
    """
    if not modules:
        return []

    percentage = round((score / total) * 100) if total > 0 else 0

    if percentage >= 80:
        skill_level = "advanced — scored very high"
    elif percentage >= 50:
        skill_level = "intermediate — scored moderately"
    else:
        skill_level = "beginner — scored low"

    module_list_text = "\n".join(
        f"  - ID {m['id']}: \"{m['title']}\" | difficulty: {m['difficulty']} | default order: {m['order']}"
        for m in modules
    )

    # Build skill breakdown section for the prompt
    if skill_scores:
        skill_lines = "\n".join(
            f"  - {tag}: {pct}% {'strong' if pct >= 70 else 'needs work' if pct >= 40 else 'weak'}"
            for tag, pct in sorted(skill_scores.items(), key=lambda x: -x[1])
        )
        skill_section = f"\nSkill-domain breakdown:\n{skill_lines}"
    else:
        skill_section = ""

    prompt = f"""You are a learning path optimizer for an online course platform.

Course: "{course_title}"
Learner's onboarding assessment: {score}/{total} ({percentage}%) — skill level: {skill_level}{skill_section}

Available modules (current default order):
{module_list_text}

Your task:
Reorder these modules into the best personalized learning path for this learner.

Rules:
- Use the skill-domain breakdown to skip modules covering skills the learner already knows well (>=70%).
- For skills scored below 40%, prioritize foundational modules on that topic.
- If the learner is advanced (>=80% overall), they can skip easy modules and start with harder ones.
- If the learner is a beginner (<50% overall), always start with the easiest modules first, no skipping.
- If intermediate, keep a sensible progression — skip only modules where the learner scored >=70% in that skill.
- Every module must appear exactly once in your output.
- "skip: true" means the system will visually mark it as optional — the learner still sees it.

Return a JSON array. Each item must have exactly these keys:
module_id (int), title (str), skip (bool), reason (str)."""

    try:
        client = _client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )

        path_data = json.loads(response.text)

        # Validate structure: make sure all module_ids are present
        returned_ids = {item["module_id"] for item in path_data}
        original_ids = {m["id"] for m in modules}
        if returned_ids != original_ids:
            print(f"[LLM] Warning: returned IDs {returned_ids} don't match original {original_ids}. Using fallback.")
            return _default_path(modules)

        return path_data

    except json.JSONDecodeError as e:
        print(f"[LLM] JSON parse error: {e}. Using default path.")
        return _default_path(modules)

    except Exception as e:
        print(f"[LLM] Gemini error: {e}. Using default path.")
        return _default_path(modules)


def _default_path(modules):
    """
    Fallback: returns modules in their original default order with no skips.
    Used when the LLM call fails for any reason.
    """
    return [
        {
            "module_id": m["id"],
            "title": m["title"],
            "skip": False,
            "reason": "Default order (AI path generation unavailable)"
        }
        for m in sorted(modules, key=lambda x: x["order"])
    ]


def generate_curriculum(course_title, course_description, num_modules, target_audience):
    """
    Calls Gemini to auto-generate a full course curriculum:
    modules (with subtopics) + onboarding assessment questions.

    Returns:
        dict with keys 'modules' and 'onboarding_assessment', or None on failure.
    """
    prompt = f"""You are an expert curriculum designer for an online course platform.

Course title: "{course_title}"
Course description: "{course_description}"
Target audience: "{target_audience}"
Number of modules to generate: {num_modules}

Generate a complete, practical course curriculum. Return a JSON object with exactly these keys:

"modules": array of {num_modules} module objects, each with:
  - "title" (string)
  - "description" (string, 1-2 sentences)
  - "content" (string, detailed markdown content for the module — at least 3 paragraphs)
  - "difficulty" (string: "easy", "medium", or "hard")
  - "order" (int, starting from 1)
  - "estimated_duration" (int, minutes)
  - "subtopics": array of 2-4 subtopic objects, each with "title" (string) and "order" (int)

"onboarding_assessment": object with:
  - "title" (string, e.g. "Python Fundamentals Knowledge Check")
  - "questions": array of {num_modules * 2} multiple-choice questions, each with:
    - "question_text" (string)
    - "option_1", "option_2", "option_3", "option_4" (strings — four distinct choices)
    - "correct_answer" (string — must exactly match one of option_1..4)
    - "difficulty" (string: "easy", "medium", or "hard")
    - "skill_tag" (string — the topic/skill this question tests, e.g. "Arrays", "OOP", "SQL Joins")

Rules:
- Make the content genuinely educational, not placeholder text.
- Skill tags should map to the module topics so the onboarding score breakdown is meaningful.
- Vary difficulty across questions (mix easy, medium, hard).
- Each question must have exactly one correct answer that is unambiguously right."""

    try:
        client = _client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=8192,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text)

        if "modules" not in data or "onboarding_assessment" not in data:
            print("[LLM] generate_curriculum: missing keys in response")
            return None

        return data

    except json.JSONDecodeError as e:
        print(f"[LLM] generate_curriculum JSON error: {e}")
        return None
    except Exception as e:
        print(f"[LLM] generate_curriculum error: {e}")
        return None


def generate_course_intro_overview(course_title, course_description, modules):
    """
    Calls Google Gemini to generate a welcoming note and an organized
    overview of the course's modules, formatted as Markdown.
    """
    if not modules:
        return f"# Welcome to {course_title}\n\n{course_description}\n\nThere are no modules registered yet."

    module_list_text = "\n".join(
        f"- {m.title}: {m.description}" for m in modules
    )

    prompt = f"""You are an educational assistant. Generate an engaging and structured welcome introduction for this course.

Course: "{course_title}"
Description: "{course_description}"

Upcoming Modules:
{module_list_text}

Provide:
1. A warm, standardized welcome note.
2. A beautiful, organized summary/list of the upcoming modules, explaining what the student will learn.

Format your output in clean Markdown. Avoid any meta-commentary, introductory remarks (like "Here is the response"), or trailing notes. Return ONLY the markdown.
"""
    try:
        client = _client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1024,
            ),
        )
        return response.text.strip()

    except Exception as e:
        print(f"[LLM] Error generating intro overview: {e}")
        # Return fallback markdown
        fallback = f"# Welcome to {course_title}\n\n"
        fallback += f"{course_description}\n\n"
        fallback += "## Upcoming Modules\n\n"
        for m in modules:
            fallback += f"### {m.title}\n{m.description}\n\n"
        return fallback
