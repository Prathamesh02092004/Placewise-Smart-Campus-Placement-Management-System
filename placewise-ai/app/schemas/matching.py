from pydantic import BaseModel


class JobMatchRequest(BaseModel):
    student_id: str
    student_profile: dict
    jobs: list[dict]


class CandidateMatchRequest(BaseModel):
    job_id: str
    job_requirements: dict
    candidates: list[dict]


class JobMatchResult(BaseModel):
    job_id: str
    match_score: float
    eligible: bool
    score_breakdown: dict


class CandidateMatchResult(BaseModel):
    student_id: str
    score: float
    breakdown: dict