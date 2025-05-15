"""
Script to fix the Pomodoro tables issue in the production environment.
This script directly creates the missing Pomodoro tables using SQLAlchemy's create_all method.
It's designed to be run in the production environment to fix the issue with the
Pomodoro tables not being properly created.

Usage:
    python -m scripts.fix_pomodoro_tables

This script will:
1. Check if the Pomodoro tables exist
2. Create any missing tables
3. Verify that the tables were created successfully
4. Update the alembic_version table to include the Pomodoro migration
"""

import sys
import os
import logging
from sqlalchemy import inspect, text, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Get DATABASE_URL from environment or from app settings
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    try:
        from app.core.config import settings

        DATABASE_URL = settings.DATABASE_URL
    except ImportError:
        logger.error(
            "DATABASE_URL environment variable not set and could not import settings"
        )
        sys.exit(1)

logger.info(f"Using DATABASE_URL: {DATABASE_URL}")

# Create engine and session
try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Import models after engine is created
    from app.db.database import Base
    from app.models.pomodoro import PomodoroSession, PomodoroAIUsage, PomodoroAIHistory
    from app.models.user import User
except Exception as e:
    logger.error(f"Error setting up database connection: {str(e)}")
    sys.exit(1)


def check_table_exists(table_name):
    """Check if a table exists in the database."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def create_pomodoro_tables():
    """Create Pomodoro tables if they don't exist."""
    try:
        # Check if tables exist
        pomodoro_sessions_exists = check_table_exists("pomodoro_sessions")
        pomodoro_ai_usage_exists = check_table_exists("pomodoro_ai_usage")
        pomodoro_ai_history_exists = check_table_exists("pomodoro_ai_history")

        logger.info(
            f"Pomodoro tables exist: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}"
        )

        # Create tables if they don't exist
        if (
            not pomodoro_sessions_exists
            or not pomodoro_ai_usage_exists
            or not pomodoro_ai_history_exists
        ):
            logger.info("Creating missing Pomodoro tables...")

            # Create tables
            Base.metadata.create_all(
                engine,
                tables=[
                    PomodoroSession.__table__,
                    PomodoroAIUsage.__table__,
                    PomodoroAIHistory.__table__,
                ],
            )

            logger.info("Pomodoro tables created successfully.")
        else:
            logger.info("All Pomodoro tables already exist.")

        # Verify tables were created
        pomodoro_sessions_exists = check_table_exists("pomodoro_sessions")
        pomodoro_ai_usage_exists = check_table_exists("pomodoro_ai_usage")
        pomodoro_ai_history_exists = check_table_exists("pomodoro_ai_history")

        logger.info(
            f"Pomodoro tables after check/creation: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}"
        )

        return (
            pomodoro_sessions_exists
            and pomodoro_ai_usage_exists
            and pomodoro_ai_history_exists
        )
    except SQLAlchemyError as e:
        logger.error(f"Error creating Pomodoro tables: {str(e)}")
        return False


def update_alembic_version():
    """Update the alembic_version table to include the Pomodoro migration."""
    try:
        # Check if the migration is already in the alembic_version table
        db = SessionLocal()
        result = db.execute(
            text(
                "SELECT version_num FROM alembic_version WHERE version_num = 'add_pomodoro_tables'"
            )
        )
        migration_exists = result.fetchone() is not None
        db.close()

        if migration_exists:
            logger.info("Pomodoro migration already exists in alembic_version table.")
            return True

        # Add the migration to the alembic_version table
        db = SessionLocal()
        db.execute(
            text(
                "INSERT INTO alembic_version (version_num) VALUES ('add_pomodoro_tables')"
            )
        )
        db.commit()
        db.close()

        logger.info("Added Pomodoro migration to alembic_version table.")
        return True
    except Exception as e:
        logger.error(f"Error updating alembic_version table: {str(e)}")
        return False


def check_user_relationship():
    """Check if the User model has the relationship with Pomodoro tables."""
    try:
        # Check if User model has relationship with Pomodoro tables
        user_relationships = [r.key for r in User.__mapper__.relationships]

        has_pomodoro_sessions = "pomodoro_sessions" in user_relationships
        has_pomodoro_ai_usage = "pomodoro_ai_usage" in user_relationships
        has_pomodoro_ai_history = "pomodoro_ai_history" in user_relationships

        logger.info(
            f"User relationships: pomodoro_sessions={has_pomodoro_sessions}, pomodoro_ai_usage={has_pomodoro_ai_usage}, pomodoro_ai_history={has_pomodoro_ai_history}"
        )

        return (
            has_pomodoro_sessions and has_pomodoro_ai_usage and has_pomodoro_ai_history
        )
    except Exception as e:
        logger.error(f"Error checking User relationships: {str(e)}")
        return False


def main():
    """Main function to fix Pomodoro tables."""
    logger.info("Starting Pomodoro tables fix...")

    # Check if tables exist and create them if they don't
    tables_created = create_pomodoro_tables()

    if not tables_created:
        logger.error("Failed to create Pomodoro tables.")
        return 1

    # Update alembic_version table
    alembic_updated = update_alembic_version()

    if not alembic_updated:
        logger.error("Failed to update alembic_version table.")
        return 1

    # Check if User model has relationship with Pomodoro tables
    relationships_exist = check_user_relationship()

    if not relationships_exist:
        logger.warning(
            "User model does not have all relationships with Pomodoro tables."
        )

    logger.info("Pomodoro tables fix completed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
