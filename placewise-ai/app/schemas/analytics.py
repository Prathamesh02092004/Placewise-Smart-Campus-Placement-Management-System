from pydantic import BaseModel


class PlacementPredictRequest(BaseModel):
    student_id: str
    cgpa: float = 0.0
    skills_count: int = 0
    projects_count: int = 0
    internships_count: int = 0
    backlogs: int = 0
    branch: str = ""
    year_of_study: int = 4


class PlacementPredictResponse(BaseModel):
    probability: float
    label: str
    feature_importance: dict
    advice: list[str]