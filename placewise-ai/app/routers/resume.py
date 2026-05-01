from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.dependencies import verify_api_secret
from app.schemas.resume import ResumeData, ResumeScoreRequest, ResumeScoreResponse
from app.services.resume_parser import parse_resume
from app.services.resume_scorer import score_resume

router = APIRouter(
    prefix="/ai/resume",
    tags=["Resume"],
    dependencies=[Depends(verify_api_secret)],
)


@router.post("/parse", response_model=ResumeData)
async def parse_resume_endpoint(
    resume: UploadFile = File(..., description="PDF resume file, max 5 MB"),
):
    """
    Extract structured data from a PDF resume.
    Called by the backend when a student uploads their resume.
    Returns name, email, skills (with proficiency signals), education, experience.
    """
    if resume.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Only PDF files are accepted.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 5 MB limit.")

    return parse_resume(pdf_bytes)


@router.post("/score", response_model=ResumeScoreResponse)
async def score_resume_endpoint(request: ResumeScoreRequest):
    """
    Compute a weighted match score between a student profile and a job.
    Called asynchronously after a student submits an application.
    Returns score 0–100 and a component breakdown.
    """
    return score_resume(request)