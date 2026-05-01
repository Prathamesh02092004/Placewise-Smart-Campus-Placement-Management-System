import json
import os
from functools import lru_cache
from app.config import get_settings


@lru_cache(maxsize=1)
def load_taxonomy() -> list[dict]:
    """
    Load skill_taxonomy.json from data/ directory.
    Cached in memory after first load.
    """
    settings = get_settings()
    path = os.path.join(settings.data_dir, "skill_taxonomy.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_taxonomy_map() -> dict[str, dict]:
    """
    Returns a dict keyed by lowercase skill_name for O(1) lookups.
    """
    return {
        entry["skill_name"].lower(): entry
        for entry in load_taxonomy()
    }


@lru_cache(maxsize=20)
def load_role_profile(role_category: str) -> dict:
    """
    Load a role profile JSON from data/role_profiles/.
    Falls back to 'default.json' if the specific profile doesn't exist.
    """
    settings = get_settings()
    safe_name = role_category.replace("/", "_").replace(" ", "_").lower()
    path = os.path.join(settings.data_dir, "role_profiles", f"{safe_name}.json")
    fallback = os.path.join(settings.data_dir, "role_profiles", "default.json")

    target = path if os.path.exists(path) else fallback
    if not os.path.exists(target):
        return {
            "role_category": role_category,
            "core_skills": [],
            "nice_to_have_skills": [],
            "tech_tracks": {},
        }
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)


def get_skill_entry(skill_name: str) -> dict:
    """Return taxonomy entry for a skill, or empty dict if not found."""
    taxonomy = load_taxonomy_map()
    return taxonomy.get(skill_name.lower(), {})


def get_skills_for_role(role_category: str) -> list[dict]:
    """Return all taxonomy skills tagged for a given role category."""
    taxonomy = load_taxonomy()
    return [
        s for s in taxonomy
        if role_category.lower() in [t.lower() for t in (s.get("role_tags") or [])]
    ]


def invalidate_taxonomy_cache() -> None:
    """Call this after a weekly market signal update."""
    load_taxonomy.cache_clear()
    load_taxonomy_map.cache_clear()
    load_role_profile.cache_clear()