from fastapi import APIRouter, Depends
from app.dependencies import verify_api_secret
from app.schemas.analytics import PlacementPredictRequest, PlacementPredictResponse
from app.services.analytics_predictor import predict_placement

router = APIRouter(
    prefix="/ai/analytics",
    tags=["Analytics"],
    dependencies=[Depends(verify_api_secret)],
)


@router.post("/predict", response_model=PlacementPredictResponse)
async def predict(request: PlacementPredictRequest):
    """
    Predict placement probability for a student.
    Returns probability 0–100, label (High/Medium/Low), and improvement advice.
    """
    return predict_placement(request)