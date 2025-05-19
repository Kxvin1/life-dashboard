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

# Ensure the URL has the correct protocol prefix
if not database_url.startswith("postgresql://"):
    if database_url.startswith("postgres://"):
        # Replace postgres:// with postgresql://
        database_url = database_url.replace("postgres://", "postgresql://")
        logger.info("Fixed database URL protocol (postgres:// → postgresql://)")
    elif not "://" in database_url:
        # Add the protocol if missing
        database_url = f"postgresql://{database_url}"
        logger.info("Added postgresql:// protocol to database URL")

# Log the database URL (masked)
if "@" in database_url:
    masked_url = database_url.split("@")[1]
else:
    masked_url = "masked"
logger.info(f"Using database URL: {masked_url}")

# Simple connection approach
if is_production:
    logger.info("Configuring database connection for production")

    # Check if we're connecting to Railway's internal PostgreSQL
    is_railway_internal = "railway.internal" in database_url

    if is_railway_internal:
        # For Railway internal connections, disable SSL completely
        logger.info("Detected Railway internal connection, disabling SSL")
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"sslmode": "disable"},
        )
    else:
        # For other connections, use SSL
        logger.info("Using standard connection with SSL")
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"sslmode": "require"},
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
