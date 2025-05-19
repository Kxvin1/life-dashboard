from sqlalchemy import create_engine, event
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

# Configure connection parameters
connect_args = {}
pool_options = {
    "pool_pre_ping": True,  # Check connection before using it
    "pool_recycle": 300,  # Recycle connections every 5 minutes
    "pool_timeout": 30,  # Wait up to 30 seconds for a connection
    "pool_size": 5,  # Maintain up to 5 connections
    "max_overflow": 10,  # Allow up to 10 overflow connections
}

# Try different connection approaches based on environment
if is_production:
    # For Railway, try without any SSL parameters first
    logger.info("Configuring database connection for production")

    # Remove any SSL parameters that might be causing issues
    if "sslmode" in database_url:
        database_url = database_url.replace("sslmode=prefer", "")
        database_url = database_url.replace("sslmode=require", "")
        database_url = database_url.replace("sslmode=disable", "")
        # Clean up URL
        database_url = database_url.replace("?&", "?")
        database_url = database_url.replace("&&", "&")
        if database_url.endswith("?") or database_url.endswith("&"):
            database_url = database_url[:-1]

    # Create engine with minimal configuration
    logger.info(
        f"Using database URL: {database_url.split('@')[1] if '@' in database_url else 'masked'}"
    )
    engine = create_engine(database_url, **pool_options)
else:
    # For development, use standard connection
    logger.info("Using development database connection")
    engine = create_engine(database_url, **pool_options)


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


# Dependency with retry logic
def get_db():
    # Maximum number of retries
    max_retries = 3
    retry_delay = 1  # seconds

    for attempt in range(max_retries):
        db = SessionLocal()
        try:
            # Test the connection
            db.execute("SELECT 1")
            yield db
            break
        except OperationalError as e:
            # Close the failed connection
            db.close()

            if attempt < max_retries - 1:
                logger.warning(
                    f"Database connection failed (attempt {attempt+1}/{max_retries}): {str(e)}"
                )
                time.sleep(retry_delay)
                # Increase delay for next retry
                retry_delay *= 2
            else:
                logger.error(
                    f"Database connection failed after {max_retries} attempts: {str(e)}"
                )
                # On last attempt, yield a db session anyway - the endpoint will handle the error
                db = SessionLocal()
                yield db
        finally:
            db.close()
