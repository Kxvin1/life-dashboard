from sqlalchemy import event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.core.config import settings
from app.db.engine import make_engine
import os
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL
database_url = settings.DATABASE_URL

# Create engine using shared module
engine = make_engine(database_url)


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
