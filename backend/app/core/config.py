from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    FRONTEND_URL: str = "http://localhost:3000"  # Default to localhost in development
    
    class Config:
        env_file = ".env"

settings = Settings() 