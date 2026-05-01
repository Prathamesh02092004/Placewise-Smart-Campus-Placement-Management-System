# PlaceWise AI Service

FastAPI microservice providing resume parsing, skill gap analysis,
job matching, and placement analytics for the PlaceWise platform.

## Setup

```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download the spaCy model (small — 12 MB)
python -m spaCy download en_core_web_sm

# 4. Copy env and set your secret
cp .env.example .env
# Edit .env — set AI_SECRET_KEY to match AI_SERVICE_SECRET in backend .env

# 5. Start the service
venv\Scripts\python -m uvicorn app.main:app --reload
```

The service starts on http://localhost:8000.
Interactive docs at http://localhost:8000/docs.

## Endpoints

| Method | Path | Called by |
|--------|------|-----------|
| POST | /ai/resume/parse | Backend on resume upload |
| POST | /ai/resume/score | Backend after application submit |
| POST | /ai/skill-gap/analyze | Backend when student views job |
| GET  | /ai/skill-gap/market-signals | Weekly cron job |
| POST | /ai/skill-gap/learning-path | Student learning path page |
| POST | /ai/skill-gap/batch-analyze | Placement officer batch view |
| POST | /ai/match/jobs | Job listing ranked for student |
| POST | /ai/match/candidates | Recruiter candidate ranking |
| POST | /ai/analytics/predict | Student placement probability |

## Authentication

Every request must include the header: