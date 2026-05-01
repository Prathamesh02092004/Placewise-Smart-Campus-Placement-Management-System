"""
Build an ordered learning path from a list of gap skill names.
Enriches each step with learning URLs from the taxonomy.
"""
from app.utils.skill_taxonomy import load_taxonomy_map, load_role_profile
from app.schemas.skill_gap import LearningStep


def build_learning_path(gap_skills: list[str], role_category: str) -> list[LearningStep]:
    """
    Returns an ordered list of LearningStep objects.
    Priority: CRITICAL skills first, then IMPORTANT, then NICE_TO_HAVE.
    """
    if not gap_skills:
        return []

    taxonomy_map  = load_taxonomy_map()
    role_profile  = load_role_profile(role_category)

    # Build importance weight map from role profile
    weight_map: dict[str, float] = {}
    for entry in role_profile.get("core_skills", []):
        name = entry.get("skill", "").lower()
        weight_map[name] = float(entry.get("weight", 0.5))
    for entry in role_profile.get("nice_to_have_skills", []):
        name = entry.get("skill", "").lower()
        weight_map.setdefault(name, float(entry.get("weight", 0.3)))

    steps: list[LearningStep] = []
    for i, skill_name in enumerate(gap_skills[:15]):  # cap at 15 steps
        key      = skill_name.lower()
        weight   = weight_map.get(key, 0.5)
        tax_entry = taxonomy_map.get(key, {})
        urls     = tax_entry.get("learning_urls") or []

        if weight > 0.7:
            priority = "urgent"
        elif weight >= 0.4:
            priority = "high"
        else:
            priority = "medium"

        # Use first URL if available
        if urls and isinstance(urls, list) and len(urls) > 0:
            first = urls[0] if isinstance(urls[0], dict) else {}
            steps.append(LearningStep(
                order=i + 1,
                skill_name=skill_name,
                priority=priority,
                platform=first.get("platform", "Online"),
                course_title=first.get("title", f"Learn {skill_name}"),
                url=first.get("url", ""),
                duration_hrs=float(first.get("duration_hrs", 0)),
                is_free=bool(first.get("is_free", True)),
            ))
        else:
            # Generic fallback
            steps.append(LearningStep(
                order=i + 1,
                skill_name=skill_name,
                priority=priority,
                platform="Various",
                course_title=f"Learn {skill_name}",
                url=f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+tutorial",
                duration_hrs=0.0,
                is_free=True,
            ))

    # Sort: urgent first, then high, then medium
    priority_order = {"urgent": 0, "high": 1, "medium": 2}
    steps.sort(key=lambda s: priority_order.get(s.priority, 2))
    for i, step in enumerate(steps):
        step.order = i + 1

    return steps