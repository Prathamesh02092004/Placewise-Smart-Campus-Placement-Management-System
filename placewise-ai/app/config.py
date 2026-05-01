from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    ai_secret_key: str = "changeme_set_in_dotenv"
    log_level: str = "info"
    port: int = 8000
    backend_url: str = "http://localhost:5000"
    spacy_model: str = "en_core_web_sm"
    sentence_model: str = "all-MiniLM-L6-v2"
    github_token: str = ""
    stackoverflow_key: str = ""

    # Paths
    data_dir: str = "data"
    models_dir: str = "trained_models"


@lru_cache
def get_settings() -> Settings:
    return Settings()