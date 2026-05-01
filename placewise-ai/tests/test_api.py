import pytest
from fastapi.testclient import TestClient
from app.main import app

SECRET = "changeme_set_in_dotenv"
HEADERS = {"x-api-secret": SECRET}
client  = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_auth_required():
    resp = client.post("/ai/resume/score", json={})
    assert resp.status_code == 422 or resp.status_code == 401


def test_resume_score_basic():
    payload = {
        "student_profile": {
            "skills": ["Python", "SQL", "Git"],
            "cgpa": 8.0,
            "branch": "Computer Engineering",
            "internships": [],
            "projects": [],
        },
        "job_requirements": {
            "required_skills": ["Python", "SQL", "Docker"],
            "min_cgpa": 7.0,
            "role_category": "software_engineer",
            "description": "Backend Python developer role",
        },
    }
    resp = client.post("/ai/resume/score", json=payload, headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert 0 <= data["score"] <= 100
    assert "breakdown" in data


def test_skill_gap_analyze():
    payload = {
        "student_id": "test-student",
        "job_id": "test-job",
        "role_category": "software_engineer",
        "student_skills": ["Python", "Git"],
        "job_skills": ["Python", "React.js", "Docker", "SQL"],
        "student_cgpa": 7.5,
        "student_branch": "Computer Engineering",
    }
    resp = client.post("/ai/skill-gap/analyze", json=payload, headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["severity"] in ("critical", "moderate", "ready")
    assert 0 <= data["overall_match"] <= 100


def test_market_signals():
    resp = client.get("/ai/skill-gap/market-signals", headers=HEADERS)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_placement_predict():
    payload = {
        "student_id": "test",
        "cgpa": 8.5,
        "skills_count": 10,
        "projects_count": 3,
        "internships_count": 1,
        "backlogs": 0,
        "branch": "Computer Engineering",
        "year_of_study": 4,
    }
    resp = client.post("/ai/analytics/predict", json=payload, headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert 0 <= data["probability"] <= 100
    assert data["label"] in ("High", "Medium", "Low")