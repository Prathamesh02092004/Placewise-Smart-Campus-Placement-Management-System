"""
Six-step skill gap analysis pipeline.
Step 1: Load & merge role profile with recruiter job skills
Step 2: Normalise all skill strings
Step 3: Set-difference computation (missing / matched / extra)
Step 4: Proficiency estimation from resume text
Step 5: Market demand enrichment
Step 6: Severity classification + overall match score
"""
import re
import math
import logging
from typing import Optional

from app.schemas.skill_gap import (
    SkillGapRequest, SkillGapResponse,
    SkillDetail, WeakSkillDetail, MarketSkill,
)
from app.utils.text_processing import (
    normalise_skill, normalise_skill_list,
    DEEP_VERBS, MEDIUM_VERBS,
)
from app.utils.skill_taxonomy import (
    load_taxonomy_map, get_skills_for_role, load_role_profile,
)
from app.services.learning_path import build_learning_path

logger = logging.getLogger(__name__)


def _estimate_proficiency(
    skill_name: str,
    resume_text: Optional[str],
    required_score: float,
) -> float:
    """
    Estimate proficiency 0–100 from resume text signals.
    Three components: frequency (0–40), depth verbs (0–30), recency (0–30).

    IMPORTANT — no resume case:
    When resume_text is absent we cannot assess proficiency. The student has
    explicitly listed the skill in their profile, so we trust them and credit
    them at exactly required_score (zero gap delta). This prevents the formula
    from mass-penalising every matched skill and producing 0% overall_match for
    students who haven't uploaded a resume yet.
    """
    if not resume_text or not resume_text.strip():
        # Trust the student's self-declared skill list; assume they meet the bar.
        return float(required_score)

    text_lower = resume_text.lower()
    aliases    = [skill_name.lower()]

    # Frequency score (0–40)
    count      = sum(len(re.findall(re.escape(a), text_lower)) for a in aliases)
    freq_score = min(40.0, math.log(count + 1, 2) * 13) if count else 0.0

    # Depth score — verb context (0–30)
    depth_score = 0.0
    window      = 80
    for alias in aliases:
        for m in re.finditer(re.escape(alias), text_lower):
            start = max(0, m.start() - window)
            ctx   = set(text_lower[start: m.end() + window].split())
            if ctx & DEEP_VERBS:
                depth_score = max(depth_score, 30.0)
            elif ctx & MEDIUM_VERBS:
                depth_score = max(depth_score, 20.0)
            else:
                depth_score = max(depth_score, 10.0)

    # Recency score (0–30) — simple proxy: any mention implies recent use
    recency_score = 30.0 if count > 0 else 0.0

    raw = min(100.0, round(freq_score + depth_score + recency_score, 1))

    # Floor: never score a listed skill below 40 — the student owns it.
    return max(40.0, raw)


def _merge_role_profile(role_category: str, job_skills: list[str]) -> dict[str, dict]:
    """
    Step 1: Build unified required_skills dict.
    Keys:   normalised skill_name (lowercase)
    Values: { skill_name, importance_weight, required_score }
    """
    profile = load_role_profile(role_category)
    merged: dict[str, dict] = {}

    for entry in profile.get("core_skills", []):
        name = normalise_skill(entry.get("skill", ""))
        if name:
            merged[name.lower()] = {
                "skill_name":        name,
                "importance_weight": float(entry.get("weight", 0.5)),
                "required_score":    float(entry.get("required_score", 60)),
            }

    for entry in profile.get("nice_to_have_skills", []):
        name = normalise_skill(entry.get("skill", ""))
        if name and name.lower() not in merged:
            merged[name.lower()] = {
                "skill_name":        name,
                "importance_weight": float(entry.get("weight", 0.3)),
                "required_score":    50.0,
            }

    # Recruiter-specified skills — add or boost weight
    for skill in job_skills:
        normed = normalise_skill(skill)
        key    = normed.lower()
        if not normed:
            continue
        if key in merged:
            merged[key]["importance_weight"] = min(
                1.0, merged[key]["importance_weight"] * 1.2
            )
        else:
            merged[key] = {
                "skill_name":        normed,
                "importance_weight": 0.5,
                "required_score":    60.0,
            }

    return merged


def analyze_gap(request: SkillGapRequest) -> SkillGapResponse:
    """Full six-step gap analysis. Returns SkillGapResponse."""

    # ── Step 1: Role profile + recruiter skills ───────────────────────────
    required = _merge_role_profile(request.role_category, request.job_skills)

    # ── Step 2: Normalise student skills ─────────────────────────────────
    student_norm = normalise_skill_list(request.student_skills)
    student_set  = {s.lower() for s in student_norm}

    # ── Step 3: Set difference ────────────────────────────────────────────
    missing_keys = {k for k in required if k not in student_set}
    matched_keys = {k for k in required if k in student_set}
    extra_skills = [s for s in student_norm if s.lower() not in required]

    # ── Step 4: Proficiency for matched skills ────────────────────────────
    taxonomy_map = load_taxonomy_map()
    weak_skills: list[WeakSkillDetail] = []

    has_resume = bool(request.resume_text and request.resume_text.strip())

    for key in matched_keys:
        req_entry      = required[key]
        required_score = req_entry["required_score"]
        proficiency    = _estimate_proficiency(
            req_entry["skill_name"],
            request.resume_text,
            required_score,       # ← pass required_score for the no-resume floor
        )
        if proficiency < required_score:
            weak_skills.append(WeakSkillDetail(
                skill_name=req_entry["skill_name"],
                student_score=round(proficiency, 1),
                required_score=round(required_score, 1),
                gap_delta=round(required_score - proficiency, 1),
            ))

    weak_skills.sort(key=lambda x: x.gap_delta, reverse=True)

    # ── Step 4b: Missing skills with taxonomy enrichment ──────────────────
    missing_weights: dict[str, float] = {}
    missing_skills: list[SkillDetail] = []

    for key in missing_keys:
        req_entry = required[key]
        weight    = req_entry["importance_weight"]
        tax_entry = taxonomy_map.get(key, {})
        demand    = float(tax_entry.get("market_demand", 50.0))
        trend     = tax_entry.get("demand_trend", "stable")
        learning  = tax_entry.get("learning_urls") or []

        if weight > 0.7:
            tag = "CRITICAL"
        elif weight >= 0.4:
            tag = "IMPORTANT"
        else:
            tag = "NICE_TO_HAVE"

        missing_weights[key] = weight

        missing_skills.append(SkillDetail(
            skill_name=req_entry["skill_name"],
            tag=tag,
            demand_score=demand,
            demand_trend=trend,
            composite_score=round(weight * demand, 2),
            learning_urls=learning if isinstance(learning, list) else [],
        ))

    missing_skills.sort(key=lambda x: x.composite_score, reverse=True)

    # ── Step 5: Market demand top-10 for role ────────────────────────────
    role_skills = get_skills_for_role(request.role_category)
    market_demand: list[MarketSkill] = []
    for s in sorted(
        role_skills,
        key=lambda x: float(x.get("market_demand", 0)),
        reverse=True
    )[:10]:
        market_demand.append(MarketSkill(
            skill_name=s["skill_name"],
            category=s.get("category", ""),
            demand_score=float(s.get("market_demand", 0)),
            demand_trend=s.get("demand_trend", "stable"),
            in_student_profile=s["skill_name"].lower() in student_set,
        ))

    # ── Step 6: Severity classification + overall match ──────────────────
    critical_missing = [s for s in missing_skills if s.tag == "CRITICAL"]

    if len(critical_missing) >= 3:
        severity = "critical"
    elif len(critical_missing) >= 1 or len(weak_skills) >= 3:
        severity = "moderate"
    else:
        severity = "ready"

    # ── Overall match formula ─────────────────────────────────────────────
    #
    # The score is 100 minus penalties for gaps.  Penalties are proportional
    # to how important the gap is and how large it is.
    #
    # Missing-skill penalty: scaled by importance weight (not by 50/30/10 raw
    # constants, which were too large and drove scores to 0).
    #   CRITICAL    → weight × 35   (max single penalty ≈ 35 for weight=1.0)
    #   IMPORTANT   → weight × 20
    #   NICE_TO_HAVE → weight × 8
    #
    # Weak-skill penalty: gap_delta × 0.15 (was 0.3 — halved so that matched
    # but slightly-below-bar skills don't dominate the score).
    #
    # Total penalty is capped at 100 so overall_match is always in [0, 100].
    #
    penalty = 0.0

    for s in missing_skills:
        w = missing_weights.get(s.skill_name.lower(), 0.5)
        if s.tag == "CRITICAL":
            penalty += w * 35
        elif s.tag == "IMPORTANT":
            penalty += w * 20
        else:
            penalty += w * 8

    # Only apply weak-skill penalty when we have resume evidence.
    # Without a resume, proficiency = required_score → gap_delta = 0 anyway,
    # but this guard makes the intent explicit.
    if has_resume:
        for s in weak_skills:
            penalty += s.gap_delta * 0.15

    overall_match = round(max(0.0, min(100.0, 100.0 - penalty)), 1)

    # ── Learning path ─────────────────────────────────────────────────────
    gap_skill_names = (
        [s.skill_name for s in missing_skills] +
        [s.skill_name for s in weak_skills]
    )
    learning_path = build_learning_path(gap_skill_names, request.role_category)

    logger.info(
        f"Gap analysis: student={request.student_id} job={request.job_id} "
        f"severity={severity} match={overall_match}% "
        f"missing={len(missing_skills)} weak={len(weak_skills)} "
        f"has_resume={has_resume}"
    )

    return SkillGapResponse(
        severity=severity,
        overall_match=overall_match,
        missing_skills=missing_skills,
        weak_skills=weak_skills,
        extra_skills=extra_skills,
        market_demand=market_demand,
        learning_path=learning_path,
    )