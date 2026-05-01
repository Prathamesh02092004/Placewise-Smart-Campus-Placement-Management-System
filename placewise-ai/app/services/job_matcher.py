"""
Job and candidate matching using TF-IDF cosine + CGPA/branch filters.
"""
import logging
from app.schemas.matching import JobMatchResult, CandidateMatchResult
from app.utils.text_processing import normalise_skill_list
from app.services.resume_scorer import _skills_overlap_score, _cgpa_score, _branch_alignment_score

logger = logging.getLogger(__name__)


def match_jobs_for_student(student_profile: dict, jobs: list[dict]) -> list[JobMatchResult]:
    """
    Rank all provided jobs by match score against the student profile.
    Returns sorted list, highest score first.
    """
    student_skills  = normalise_skill_list(student_profile.get("skills") or [])
    student_cgpa    = float(student_profile.get("cgpa") or 0)
    student_branch  = str(student_profile.get("branch") or "")
    results: list[JobMatchResult] = []

    for job in jobs:
        job_id       = str(job.get("id", ""))
        min_cgpa     = float(job.get("min_cgpa") or 0)
        role_cat     = str(job.get("role_category") or "software_engineer")
        job_skills   = normalise_skill_list(job.get("required_skills") or [])
        eligible_br  = job.get("eligible_branches") or []

        # Eligibility hard gates
        eligible = True
        if min_cgpa > 0 and student_cgpa > 0 and student_cgpa < min_cgpa:
            eligible = False
        if eligible_br and student_branch and student_branch not in eligible_br:
            eligible = False

        skills_score, _, _ = _skills_overlap_score(student_skills, job_skills)
        cgpa_s             = _cgpa_score(student_cgpa, min_cgpa)
        branch_s           = _branch_alignment_score(student_branch, role_cat)

        final = round(0.50 * skills_score + 0.30 * cgpa_s + 0.20 * branch_s, 1)

        results.append(JobMatchResult(
            job_id=job_id,
            match_score=final,
            eligible=eligible,
            score_breakdown={
                "skills":  skills_score,
                "cgpa":    cgpa_s,
                "branch":  branch_s,
            },
        ))

    results.sort(key=lambda x: (x.eligible, x.match_score), reverse=True)
    return results


def rank_candidates(job_requirements: dict, candidates: list[dict]) -> list[CandidateMatchResult]:
    """
    Rank candidates for a given job. Used by recruiter CandidateView AI scoring.
    """
    from app.schemas.resume import JobRequirements, StudentProfile, ResumeScoreRequest
    from app.services.resume_scorer import score_resume

    results: list[CandidateMatchResult] = []
    for candidate in candidates:
        student_id = str(candidate.get("student_id") or candidate.get("id") or "")
        profile    = StudentProfile(
            skills=candidate.get("skills") or [],
            cgpa=float(candidate.get("cgpa") or 0),
            branch=str(candidate.get("branch") or ""),
            internships=candidate.get("internships") or [],
            projects=candidate.get("projects") or [],
        )
        requirements = JobRequirements(
            required_skills=job_requirements.get("required_skills") or [],
            min_cgpa=float(job_requirements.get("min_cgpa") or 0),
            role_category=str(job_requirements.get("role_category") or "software_engineer"),
            description=str(job_requirements.get("description") or ""),
        )
        scored = score_resume(ResumeScoreRequest(
            student_profile=profile,
            job_requirements=requirements,
        ))
        results.append(CandidateMatchResult(
            student_id=student_id,
            score=scored.score,
            breakdown=scored.breakdown.model_dump(),
        ))

    results.sort(key=lambda x: x.score, reverse=True)
    return results