from pydantic import BaseModel, Field
from typing import Optional


class SkillSignal(BaseModel):
    skill_name: str
    proficiency_signal: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Estimated proficiency 0-100 derived from resume text signals",
    )


class EducationEntry(BaseModel):
    institution: str = ""
    degree: str = ""
    year: Optional[str] = None


class ExperienceEntry(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""


class ResumeData(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[SkillSignal] = []
    education: list[EducationEntry] = []
    experience: list[ExperienceEntry] = []
    certifications: list[str] = []
    projects: list[str] = []
    raw_text: str = ""


class JobRequirements(BaseModel):
    required_skills: list[str]
    min_cgpa: float = 0.0
    role_category: str = "software_engineer"
    description: str = ""


class StudentProfile(BaseModel):
    skills: list[str]
    cgpa: float = 0.0
    branch: str = ""
    internships: list[dict] = []
    projects: list[dict] = []


class ResumeScoreRequest(BaseModel):
    student_profile: StudentProfile
    job_requirements: JobRequirements


class ScoreBreakdown(BaseModel):
    skills_overlap: float
    cgpa_score: float
    experience_relevance: float
    branch_alignment: float


class ResumeScoreResponse(BaseModel):
    score: float = Field(ge=0.0, le=100.0)
    breakdown: ScoreBreakdown
    matched_skills: list[str] = []
    missing_skills: list[str] = []