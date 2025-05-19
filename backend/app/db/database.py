from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

# Determine if we're in production environment
is_production = settings.ENVIRONMENT != "development"

# Configure SSL for production environments
if is_production:
    # Add SSL parameters to the connection string if not already present
    database_url = settings.DATABASE_URL
    if "sslmode" not in database_url:
        if "?" in database_url:
            database_url += "&sslmode=prefer"
        else:
            database_url += "?sslmode=prefer"

    # Create engine with SSL configuration
    engine = create_engine(database_url, connect_args={"sslmode": "prefer"})
else:
    # Use regular connection for development
    engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
