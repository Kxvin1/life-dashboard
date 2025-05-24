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

    # Redis configuration
    REDIS_URL: str = "redis://localhost:6379"  # Redis connection URL
    REDIS_ENABLED: bool = True  # Enable/disable Redis caching

    # Pre-warming configuration for production
    PREWARM_ENABLED: bool = True  # Enable/disable automatic pre-warming
    PREWARM_INTERVAL_HOURS: int = 2  # Hours between regular pre-warming runs
    PREWARM_STARTUP_DELAY_SECONDS: int = 30  # Delay before initial pre-warming
    PREWARM_MAX_RETRIES: int = 3  # Maximum retries for failed pre-warming

    class Config:
        # Only load .env file in development to prevent overriding Railway variables in production
        if os.getenv("ENVIRONMENT") != "production":
            env_file = ".env"


settings = Settings()
