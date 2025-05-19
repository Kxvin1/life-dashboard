import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_PUBLIC_URL: Optional[str] = (
        None  # Public database URL for external connections
    )
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    # Get frontend URL from environment or use default
    FRONTEND_URL: str = os.environ.get(
        "FRONTEND_URL", "https://life-dashboard-eta.vercel.app"
    )
    ALGORITHM: str = "HS256"  # Algorithm for JWT token signing
    OPENAI_API_KEY: Optional[str] = None  # OpenAI API key for AI insights

    class Config:
        env_file = ".env"


settings = Settings()
