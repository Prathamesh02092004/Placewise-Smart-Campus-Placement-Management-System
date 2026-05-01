from pydantic import BaseModel, Field
from typing import Literal, Optional


class SkillGapRequest(BaseModel):
    student_id: str
    job_id: str
    role_category: str = "software_engineer"
    student_skills: list[str]
    job_skills: list[str]
    student_cgpa: float = 0.0
    student_branch: str = ""
    resume_text: Optional[str] = None


class SkillDetail(BaseModel):
    skill_name: str
    tag: Literal["CRITICAL", "IMPORTANT", "NICE_TO_HAVE"] = "IMPORTANT"
    demand_score: float = 0.0
    demand_trend: Literal["rising", "stable", "declining"] = "stable"
    composite_score: float = 0.0
    learning_urls: list[dict] = []


class WeakSkillDetail(BaseModel):
    skill_name: str
    student_score: float
    required_score: float
    gap_delta: float


class MarketSkill(BaseModel):
    skill_name: str
    category: str = ""
    demand_score: float = 0.0
    demand_trend: Literal["rising", "stable", "declining"] = "stable"
    in_student_profile: bool = False


class LearningStep(BaseModel):
    order: int
    skill_name: str
    priority: Literal["urgent", "high", "medium"] = "medium"
    platform: str = ""
    course_title: str = ""
    url: str = ""
    duration_hrs: float = 0.0
    is_free: bool = True


class SkillGapResponse(BaseModel):
    severity: Literal["critical", "moderate", "ready"]
    overall_match: float = Field(ge=0.0, le=100.0)
    missing_skills: list[SkillDetail] = []
    weak_skills: list[WeakSkillDetail] = []
    extra_skills: list[str] = []
    market_demand: list[MarketSkill] = []
    learning_path: list[LearningStep] = []


class LearningPathRequest(BaseModel):
    gap_skills: list[str]
    role_category: str = "software_engineer"


class BatchAnalyzeRequest(BaseModel):
    job_id: str
    job_requirements: dict
    candidates: list[dict]


class BatchAnalyzeResult(BaseModel):
    student_id: str
    student_name: str = ""
    severity: str
    overall_match: float
    missing_count: int