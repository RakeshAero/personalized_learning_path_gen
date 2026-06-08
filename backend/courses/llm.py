import json
import anthropic
from django.conf import settings


def generate_personalized_path(course_title, modules, score, total):
    """
    Calls Anthropic Claude to reorder course modules into a personalized
    learning path based on the learner's onboarding assessment result.

    Args:
        course_title (str): Name of the course.
        modules (list): [{"id": int, "title": str, "difficulty": str, "order": int}, ...]
        score (int): Number of correct answers.
        total (int): Total number of questions.

    Returns:
        list: [{"module_id": int, "title": str, "skip": bool, "reason": str}, ...]
        Falls back to default module order if LLM call fails.
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

    prompt = f"""You are a learning path optimizer for an online course platform.

Course: "{course_title}"
Learner's onboarding assessment: {score}/{total} ({percentage}%) — skill level: {skill_level}

Available modules (current default order):
{module_list_text}

Your task:
Reorder these modules into the best personalized learning path for this learner.

Rules:
- If the learner is advanced (>=80%), they can skip easy modules and start with harder ones.
- If the learner is a beginner (<50%), always start with the easiest modules first, no skipping.
- If intermediate, keep a sensible progression — no skipping unless clearly redundant.
- Every module must appear exactly once in your output.
- "skip: true" means the system will visually mark it as optional — the learner still sees it.

Return ONLY a valid JSON array, no other text, no markdown code fences.
Each item must have exactly these keys: module_id (int), title (str), skip (bool), reason (str).

Example format:
[
  {{"module_id": 2, "title": "Module Name", "skip": false, "reason": "Good foundation for beginners"}},
  {{"module_id": 5, "title": "Advanced Topic", "skip": true, "reason": "Already proficient based on assessment score"}}
]"""

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        raw_text = response.content[0].text.strip()

        # Strip markdown code fences if model wraps the output
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        path_data = json.loads(raw_text)

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

    except anthropic.APIError as e:
        print(f"[LLM] Anthropic API error: {e}. Using default path.")
        return _default_path(modules)

    except Exception as e:
        print(f"[LLM] Unexpected error: {e}. Using default path.")
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
