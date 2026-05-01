from fastapi import APIRouter, Depends
from app.dependencies import verify_api_secret
from app.schemas.matching import JobMatchRequest, CandidateMatchRequest, JobMatchResult, CandidateMatchResult
from app.services.job_matcher import match_jobs_for_student, rank_candidates

router = APIRouter(
    prefix="/ai/match",
    tags=["Matching"],
    dependencies=[Depends(verify_api_secret)],
)


@router.post("/jobs", response_model=list[JobMatchResult])
async def match_jobs(request: JobMatchRequest):
    """Rank all provided jobs by match score for a given student."""
    return match_jobs_for_student(request.student_profile, request.jobs)


@router.post("/candidates", response_model=list[CandidateMatchResult])
async def match_candidates(request: CandidateMatchRequest):
    """Rank candidates for a given job. Returns sorted by score."""
    return rank_candidates(request.job_requirements, request.candidates)