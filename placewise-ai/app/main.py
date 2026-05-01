"""
PlaceWise AI Microservice — FastAPI application factory.
All ML models are loaded into memory at startup so every request is fast.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import resume, skill_gap, matching, analytics

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: pre-load heavy models into memory."""
    settings = get_settings()
    logger.info("PlaceWise AI Service starting…")

    # Pre-load spaCy
    try:
        import spacy
        app.state.nlp = spacy.load(settings.spacy_model)
        logger.info(f"spaCy model '{settings.spacy_model}' loaded.")
    except Exception as e:
        logger.warning(f"spaCy not available: {e}")
        app.state.nlp = None

    # Pre-load sentence-transformers
    try:
        from sentence_transformers import SentenceTransformer
        app.state.sentence_model = SentenceTransformer(settings.sentence_model)
        logger.info(f"Sentence transformer '{settings.sentence_model}' loaded.")
    except Exception as e:
        logger.warning(f"sentence-transformers not available: {e}")
        app.state.sentence_model = None

    # Pre-load taxonomy into LRU cache
    from app.utils.skill_taxonomy import load_taxonomy, load_taxonomy_map
    taxonomy = load_taxonomy()
    load_taxonomy_map()
    logger.info(f"Taxonomy loaded: {len(taxonomy)} skills.")

    logger.info("AI Service ready.")
    yield

    logger.info("AI Service shutting down.")


settings = get_settings()

app = FastAPI(
    title="PlaceWise AI Service",
    description="AI/ML microservice for resume parsing, skill gap analysis, job matching and placement analytics.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — only accept requests from the backend container
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://backend:5000"],
    allow_methods=["GET", "POST"],
    allow_headers=["x-api-secret", "Content-Type"],
)

app.include_router(resume.router)
app.include_router(skill_gap.router)
app.include_router(matching.router)
app.include_router(analytics.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "placewise-ai",
        "spacy": app.state.nlp is not None,
        "sentence_transformer": app.state.sentence_model is not None,
    }