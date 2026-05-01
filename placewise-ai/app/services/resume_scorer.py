"""
Resume scoring algorithm.
Weights: skills overlap 40%, CGPA 20%, experience relevance 30%, branch 10%.
Uses TF-IDF cosine for skills and sentence-transformers for experience.
"""
import logging
from typing import Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.schemas.resume import ResumeScoreRequest, ResumeScoreResponse, ScoreBreakdown
from app.utils.text_processing import normalise_skill_list

logger = logging.getLogger(__name__)

# Branch → role domain compatibility table
BRANCH_ROLE_COMPAT: dict[str, dict[str, float]] = {
    "Computer Engineering":              {"software": 1.0, "data": 0.9, "devops": 0.95, "embedded": 0.7, "default": 0.85},
    "Information Technology":            {"software": 0.95, "data": 0.9, "devops": 0.9, "embedded": 0.6, "default": 0.80},
    "Electronics and Telecommunication": {"software": 0.8, "data": 0.75, "devops": 0.7, "embedded": 1.0, "default": 0.75},
    "Electrical Engineering":            {"software": 0.65, "data": 0.7, "devops": 0.6, "embedded": 0.95, "default": 0.65},
    "Mechanical Engineering":            {"software": 0.5, "data": 0.6, "devops": 0.5, "embedded": 0.7, "default": 0.55},
    "Civil Engineering":                 {"software": 0.45, "data": 0.55, "devops": 0.45, "embedded": 0.4, "default": 0.50},
}


def _get_role_key(role_category: str) -> str:
    cat = role_category.lower()
    if "data" in cat or "analyst" in cat or "scientist" in cat:
        return "data"
    if "devops" in cat or "cloud" in cat or "sre" in cat:
        return "devops"
    if "embedded" in cat or "hardware" in cat or "iot" in cat:
        return "embedded"
    return "software"


def _skills_overlap_score(student_skills: list[str], job_skills: list[str]) -> tuple[float, list[str], list[str]]:
    """
    TF-IDF cosine similarity between skill lists.
    Returns (score_0_100, matched, missing).
    """
    if not job_skills:
        return 50.0, [], []

    student_norm = normalise_skill_list(student_skills)
    job_norm     = normalise_skill_list(job_skills)

    student_set = {s.lower() for s in student_norm}
    job_set     = {s.lower() for s in job_norm}

    matched  = [s for s in job_norm if s.lower() in student_set]
    missing  = [s for s in job_norm if s.lower() not in student_set]

    if not student_norm or not job_norm:
        return 0.0, matched, missing

    # TF-IDF cosine
    try:
        docs = [" ".join(student_norm), " ".join(job_norm)]
        vec  = TfidfVectorizer(analyzer="word", tokenizer=lambda x: x.split())
        mat  = vec.fit_transform(docs)
        tfidf_score = float(cosine_similarity(mat[0], mat[1])[0][0])
    except Exception:
        tfidf_score = len(matched) / max(len(job_norm), 1)

    # Weighted blend: 60% exact overlap ratio, 40% TF-IDF
    exact_ratio  = len(matched) / max(len(job_norm), 1)
    blended      = 0.6 * exact_ratio + 0.4 * tfidf_score
    return round(min(100.0, blended * 100), 1), matched, missing


def _cgpa_score(student_cgpa: float, min_cgpa: float) -> float:
    """Step function CGPA score 0–100."""
    if min_cgpa <= 0:
        return 80.0
    if student_cgpa < min_cgpa:
        return 0.0  # Hard gate
    gap = student_cgpa - min_cgpa
    if gap >= 0.5:
        return 100.0
    return round(50.0 + (gap / 0.5) * 50.0, 1)


def _experience_relevance_score(internships: list[dict], projects: list[dict], job_description: str) -> float:
    """
    Semantic similarity between candidate's experience narrative and job description.
    Falls back to heuristic if sentence-transformers unavailable.
    """
    exp_text = " ".join([
        str(i.get("description", "") or i.get("company", ""))
        for i in (internships or [])
    ] + [
        str(p.get("name", "") or p.get("description", ""))
        for p in (projects or [])
    ]).strip()

    if not exp_text or not job_description:
        return 40.0

    try:
        from sentence_transformers import SentenceTransformer
        from app.config import get_settings
        model = SentenceTransformer(get_settings().sentence_model)
        embs  = model.encode([exp_text[:512], job_description[:512]])
        sim   = float(cosine_similarity([embs[0]], [embs[1]])[0][0])
        return round(max(0.0, min(100.0, sim * 100)), 1)
    except Exception as e:
        logger.debug(f"Sentence transformer unavailable: {e}. Using heuristic.")
        # Heuristic: keyword overlap
        exp_words = set(exp_text.lower().split())
        job_words = set(job_description.lower().split())
        overlap   = len(exp_words & job_words) / max(len(job_words), 1)
        return round(min(100.0, overlap * 200), 1)


def _branch_alignment_score(branch: str, role_category: str) -> float:
    compat  = BRANCH_ROLE_COMPAT.get(branch, {})
    role_key = _get_role_key(role_category)
    return round(compat.get(role_key, compat.get("default", 0.6)) * 100, 1)


def score_resume(request: ResumeScoreRequest) -> ResumeScoreResponse:
    """
    Compute weighted match score.
    Skills 40% + CGPA 20% + Experience 30% + Branch 10%.
    """
    prof = request.student_profile
    job  = request.job_requirements

    skills_score, matched, missing = _skills_overlap_score(prof.skills, job.required_skills)
    cgpa_score   = _cgpa_score(prof.cgpa, job.min_cgpa)
    exp_score    = _experience_relevance_score(prof.internships, prof.projects, job.description)
    branch_score = _branch_alignment_score(prof.branch, job.role_category)

    # Hard gate on CGPA
    if prof.cgpa > 0 and job.min_cgpa > 0 and prof.cgpa < job.min_cgpa:
        final_score = 0.0
    else:
        final_score = round(
            0.40 * skills_score +
            0.20 * cgpa_score   +
            0.30 * exp_score    +
            0.10 * branch_score,
            1
        )

    return ResumeScoreResponse(
        score=final_score,
        breakdown=ScoreBreakdown(
            skills_overlap=skills_score,
            cgpa_score=cgpa_score,
            experience_relevance=exp_score,
            branch_alignment=branch_score,
        ),
        matched_skills=matched,
        missing_skills=missing,
    )