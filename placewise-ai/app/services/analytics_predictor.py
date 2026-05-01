"""
Placement probability predictor.
Uses a simple rule-based model that improves once real data is available.
When trained_models/placement_predictor.pkl exists, uses that instead.
"""
import logging
import os
from app.schemas.analytics import PlacementPredictRequest, PlacementPredictResponse

logger = logging.getLogger(__name__)


def _load_model():
    """Try to load a trained sklearn model from disk."""
    try:
        import pickle
        from app.config import get_settings
        path = os.path.join(get_settings().models_dir, "placement_predictor.pkl")
        if os.path.exists(path):
            with open(path, "rb") as f:
                return pickle.load(f)
    except Exception as e:
        logger.debug(f"Model load skipped: {e}")
    return None


def _rule_based_probability(req: PlacementPredictRequest) -> float:
    """
    Heuristic placement probability 0.0–1.0.
    Based on features extracted from student profile.
    """
    score = 0.0

    # CGPA contribution (0–35 points)
    if req.cgpa >= 9.0:
        score += 35
    elif req.cgpa >= 8.0:
        score += 28
    elif req.cgpa >= 7.0:
        score += 20
    elif req.cgpa >= 6.0:
        score += 12
    else:
        score += 5

    # Skills count (0–25 points)
    if req.skills_count >= 15:
        score += 25
    elif req.skills_count >= 10:
        score += 20
    elif req.skills_count >= 6:
        score += 15
    elif req.skills_count >= 3:
        score += 8
    else:
        score += 2

    # Projects (0–20 points)
    if req.projects_count >= 5:
        score += 20
    elif req.projects_count >= 3:
        score += 15
    elif req.projects_count >= 1:
        score += 8

    # Internships (0–15 points)
    if req.internships_count >= 3:
        score += 15
    elif req.internships_count >= 2:
        score += 12
    elif req.internships_count >= 1:
        score += 8

    # Backlogs penalty (0–5 points penalty)
    if req.backlogs == 0:
        score += 5
    elif req.backlogs <= 2:
        score -= 5
    else:
        score -= 15

    # Branch bonus
    high_demand_branches = {"Computer Engineering", "Information Technology"}
    if req.branch in high_demand_branches:
        score += 5

    return round(min(1.0, max(0.0, score / 100)), 3)


def _generate_advice(req: PlacementPredictRequest, prob: float) -> list[str]:
    advice: list[str] = []
    if req.cgpa < 7.0:
        advice.append("Improve your CGPA to at least 7.0 to qualify for most companies.")
    if req.skills_count < 6:
        advice.append("Add at least 6 technical skills to your profile — upload an updated resume.")
    if req.internships_count == 0:
        advice.append("Complete at least one internship or freelance project to strengthen your profile.")
    if req.projects_count < 2:
        advice.append("Build 2–3 projects and add them to your profile to demonstrate practical skills.")
    if req.backlogs > 0:
        advice.append("Clear your active backlogs — many companies have a zero-backlog requirement.")
    if prob >= 0.8:
        advice.append("Strong profile! Apply broadly and prepare well for technical interviews.")
    elif prob >= 0.6:
        advice.append("Good profile. Focus on the skill gap analysis for each job you're interested in.")
    return advice[:4]


def predict_placement(request: PlacementPredictRequest) -> PlacementPredictResponse:
    """
    Predict placement probability. Returns probability + advice.
    """
    model = _load_model()

    if model:
        try:
            import numpy as np
            features = np.array([[
                request.cgpa,
                request.skills_count,
                request.projects_count,
                request.internships_count,
                request.backlogs,
                request.year_of_study,
            ]])
            prob  = float(model.predict_proba(features)[0][1])
        except Exception as e:
            logger.warning(f"Model inference failed: {e}. Using rule-based fallback.")
            prob = _rule_based_probability(request)
    else:
        prob = _rule_based_probability(request)

    label   = "High" if prob >= 0.7 else "Medium" if prob >= 0.4 else "Low"
    advice  = _generate_advice(request, prob)

    return PlacementPredictResponse(
        probability=round(prob * 100, 1),
        label=label,
        feature_importance={
            "cgpa":        round(request.cgpa / 10 * 35, 1),
            "skills":      min(25.0, request.skills_count * 1.7),
            "projects":    min(20.0, request.projects_count * 5.0),
            "internships": min(15.0, request.internships_count * 7.5),
            "backlogs":    max(-15.0, request.backlogs * -5.0),
        },
        advice=advice,
    )