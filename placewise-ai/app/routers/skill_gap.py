from fastapi import APIRouter, Depends, Query
from app.dependencies import verify_api_secret
from app.schemas.skill_gap import (
    SkillGapRequest, SkillGapResponse,
    LearningPathRequest, LearningStep,
    BatchAnalyzeRequest, BatchAnalyzeResult,
    MarketSkill,
)
from app.services.skill_gap_analyzer import analyze_gap
from app.services.learning_path import build_learning_path
from app.services.market_signals import fetch_market_signals

router = APIRouter(
    prefix="/ai/skill-gap",
    tags=["Skill Gap"],
    dependencies=[Depends(verify_api_secret)],
)


@router.post("/analyze", response_model=SkillGapResponse)
async def analyze_skill_gap(request: SkillGapRequest):
    """
    Run the six-step skill gap analysis pipeline.
    Called when a student views a job detail page.
    Returns severity, overall match, missing skills, weak skills, market demand, learning path.
    """
    return analyze_gap(request)


@router.get("/market-signals", response_model=list[MarketSkill])
async def get_market_signals(
    role_category: str = Query(default="", description="Filter by role category"),
):
    """
    Return current market demand scores for all skills.
    Called by the weekly cron job to refresh SkillTaxonomy in the database.
    """
    signals = await fetch_market_signals(role_category)
    return [MarketSkill(**s) for s in signals]


@router.post("/learning-path", response_model=list[LearningStep])
async def get_learning_path(request: LearningPathRequest):
    """
    Build an ordered learning path for a set of gap skills.
    Called from the student Skill Gap Report page.
    """
    return build_learning_path(request.gap_skills, request.role_category)


@router.post("/batch-analyze", response_model=list[BatchAnalyzeResult])
async def batch_analyze(request: BatchAnalyzeRequest):
    """
    Run gap analysis for multiple candidates against a single job.
    Called by the Placement Officer batch analysis feature.
    """
    results: list[BatchAnalyzeResult] = []
    for candidate in request.candidates:
        gap_request = SkillGapRequest(
            student_id=str(candidate.get("student_id") or candidate.get("id") or ""),
            job_id=request.job_id,
            role_category=request.job_requirements.get("role_category", "software_engineer"),
            student_skills=candidate.get("skills") or [],
            job_skills=request.job_requirements.get("required_skills") or [],
            student_cgpa=float(candidate.get("cgpa") or 0),
            student_branch=str(candidate.get("branch") or ""),
        )
        gap = analyze_gap(gap_request)
        results.append(BatchAnalyzeResult(
            student_id=gap_request.student_id,
            student_name=str(candidate.get("name") or ""),
            severity=gap.severity,
            overall_match=gap.overall_match,
            missing_count=len(gap.missing_skills),
        ))

    results.sort(key=lambda x: x.overall_match, reverse=True)
    return results