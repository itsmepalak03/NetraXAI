"""
NETRA XAI - Configuration
Loads environment variables and exposes a single Settings object used
throughout the backend. AI_MODE toggles between the reproducible DEMO
engine and a REAL trained-model engine (see app/ai/inference.py).
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "NETRA XAI"
    DATABASE_URL: str = "sqlite:///./netra.db"
    AI_MODE: str = "demo"  # "demo" or "real"
    MODEL_PATH: str = ""
    UPLOAD_DIR: str = "uploads"
    RESULT_DIR: str = "results"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self):
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_PATH = BASE_DIR / settings.UPLOAD_DIR
RESULT_PATH = BASE_DIR / settings.RESULT_DIR
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
RESULT_PATH.mkdir(parents=True, exist_ok=True)

# DR severity level lookup - single source of truth used across the backend
DR_LEVELS = {
    0: {"label": "No Diabetic Retinopathy", "short": "Normal", "referable": False},
    1: {"label": "Mild NPDR", "short": "Mild", "referable": False},
    2: {"label": "Moderate NPDR", "short": "Moderate", "referable": True},
    3: {"label": "Severe NPDR", "short": "Severe", "referable": True},
    4: {"label": "Proliferative DR", "short": "PDR", "referable": True},
}
