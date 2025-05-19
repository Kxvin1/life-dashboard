from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.core.config import settings
import os
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine if we're in production environment
is_production = settings.ENVIRONMENT != "development"

# Get database URL
database_url = settings.DATABASE_URL

# Log the database URL (masked)
if "@" in database_url:
    masked_url = database_url.split("@")[1]
else:
    masked_url = "masked"
logger.info(f"Using database URL: {masked_url}")

# Simple, direct connection approach
if is_production:
    logger.info("Configuring database connection for production")

    # Check if we're connecting to Railway's internal PostgreSQL
    is_railway_internal = "railway.internal" in database_url

    if is_railway_internal:
        # For Railway internal connections, disable SSL
        logger.info("Detected Railway internal connection, disabling SSL")
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"sslmode": "disable"},
        )
    else:
        # For other production environments, prefer SSL
        logger.info("Using standard production connection")
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"sslmode": "prefer"},
        )
else:
    # For development, use standard connection
    logger.info("Using development database connection")
    engine = create_engine(database_url, pool_pre_ping=True)


# Define ping function to check connection
@event.listens_for(engine, "engine_connect")
def ping_connection(connection, branch):
    if branch:
        # Don't ping on checkout for branch connections
        return

    # Ping the connection to check if it's still alive
    try:
        connection.scalar("SELECT 1")
    except Exception:
        # Connection is invalid - close it and let SQLAlchemy create a new one
        logger.warning("Database connection invalid, requesting new connection")
        connection.close()
        raise DisconnectionError("Connection invalid")


# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


# Dependency with simple retry logic
def get_db():
    # Create a new session
    db = SessionLocal()
    try:
        # Test the connection with a simple query
        try:
            db.execute(text("SELECT 1"))
        except Exception as e:
            # Log the error but continue anyway
            logger.warning(f"Database connection test failed: {str(e)}")

        # Yield the session
        yield db
    finally:
        # Always close the session
        db.close()
