from fastapi import Header, HTTPException, status
from app.config import get_settings


async def verify_api_secret(x_api_secret: str = Header(...)) -> None:
    """
    Validates the inter-service secret on every request.
    The backend injects this header on all calls to the AI service.
    """
    settings = get_settings()
    if x_api_secret != settings.ai_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API secret.",
        )