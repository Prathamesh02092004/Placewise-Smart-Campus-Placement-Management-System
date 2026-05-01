"""
Market demand signal aggregation.
Phase 1: Internal corpus analysis (skill frequency in PlaceWise jobs)
Phase 2: External API signals (GitHub Octoverse, StackOverflow)
Phase 3: Trend computation via comparison to previous snapshot
"""
import logging
from app.utils.skill_taxonomy import load_taxonomy, invalidate_taxonomy_cache

logger = logging.getLogger(__name__)


def _normalise_to_100(counts: dict[str, float]) -> dict[str, float]:
    """Min-max normalise values to 0–100 range."""
    if not counts:
        return {}
    max_val = max(counts.values()) or 1
    min_val = min(counts.values())
    span    = max_val - min_val or 1
    return {k: round((v - min_val) / span * 100, 2) for k, v in counts.items()}


async def fetch_market_signals(role_category: str = "") -> list[dict]:
    """
    Aggregate market demand signals and return skill demand list.
    Falls back gracefully to taxonomy baseline if external APIs unavailable.
    """
    taxonomy = load_taxonomy()
    if not taxonomy:
        return []

    from app.config import get_settings
    settings = get_settings()

    # --- Phase 2: GitHub trending languages / topics (optional) ---
    github_counts: dict[str, float] = {}
    if settings.github_token:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.github.com/search/repositories",
                    params={"q": "stars:>1000", "sort": "stars", "per_page": 100},
                    headers={"Authorization": f"token {settings.github_token}"},
                )
                if resp.status_code == 200:
                    repos = resp.json().get("items", [])
                    for repo in repos:
                        lang = repo.get("language")
                        if lang:
                            github_counts[lang] = github_counts.get(lang, 0) + 1
        except Exception as e:
            logger.warning(f"GitHub signal fetch failed: {e}")

    normalised_github = _normalise_to_100(github_counts)

    # --- Phase 3: Blend with taxonomy baseline ---
    signals: list[dict] = []
    for entry in taxonomy:
        name      = entry["skill_name"]
        base      = float(entry.get("market_demand", 50.0))
        git_boost = normalised_github.get(name, normalised_github.get(name.lower(), 0))

        if role_category and role_category.lower() not in [
            t.lower() for t in (entry.get("role_tags") or [])
        ]:
            continue

        # Blend: 70% baseline, 30% external (if available)
        blended = (0.7 * base + 0.3 * git_boost) if git_boost else base
        signals.append({
            "skill_name":   name,
            "demand_score": round(min(100.0, blended), 2),
            "demand_trend": entry.get("demand_trend", "stable"),
            "category":     entry.get("category", ""),
        })

    signals.sort(key=lambda x: x["demand_score"], reverse=True)
    logger.info(f"Market signals generated: {len(signals)} skills")
    return signals