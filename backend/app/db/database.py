from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

# Determine if we're in production environment
is_production = settings.ENVIRONMENT != "development"

# Check if we're connecting to Railway's internal PostgreSQL
database_url = settings.DATABASE_URL
is_railway_internal = "railway.internal" in database_url

# Configure database connection
if is_production:
    if is_railway_internal:
        # Disable SSL for Railway's internal network
        if "sslmode" in database_url:
            # Remove any existing sslmode parameter
            database_url = database_url.replace("sslmode=prefer", "")
            database_url = database_url.replace("sslmode=require", "")
            # Clean up URL if needed
            database_url = database_url.replace("?&", "?")
            database_url = database_url.replace("&&", "&")
            if database_url.endswith("?") or database_url.endswith("&"):
                database_url = database_url[:-1]

        # Add sslmode=disable
        if "?" in database_url:
            database_url += "&sslmode=disable"
        else:
            database_url += "?sslmode=disable"

        # Create engine with SSL disabled
        print("Database: Using Railway internal connection with SSL disabled")
        engine = create_engine(database_url, connect_args={"sslmode": "disable"})
    else:
        # Add SSL parameters for external connections
        if "sslmode" not in database_url:
            if "?" in database_url:
                database_url += "&sslmode=prefer"
            else:
                database_url += "?sslmode=prefer"

        # Create engine with SSL configuration
        print("Database: Using external connection with SSL enabled")
        engine = create_engine(database_url, connect_args={"sslmode": "prefer"})
else:
    # Use regular connection for development
    print("Database: Using development connection")
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
