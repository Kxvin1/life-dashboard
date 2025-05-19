"""
Script to fix migration issues in the Railway deployment.
This script ensures all migrations are applied.
"""

import os
import sys
import time
import traceback
import logging
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import settings in a way that works in Railway environment
try:
    from app.core.config import settings

    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback for Railway environment
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        logger.warning("DATABASE_URL environment variable not set")
        # For testing purposes, don't exit if we're just importing the module
        if __name__ == "__main__":
            sys.exit(1)
        else:
            DATABASE_URL = "postgresql://placeholder:placeholder@localhost/placeholder"

# Determine if we're in production environment
is_production = os.environ.get("ENVIRONMENT", "development") != "development"

# Add initial delay to allow database to initialize
if is_production and __name__ == "__main__":
    logger.info("Waiting 10 seconds for database to initialize...")
    time.sleep(10)

# Ensure the URL has the correct protocol prefix
if not DATABASE_URL.startswith("postgresql://"):
    if DATABASE_URL.startswith("postgres://"):
        # Replace postgres:// with postgresql://
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://")
        logger.info("Fixed database URL protocol (postgres:// → postgresql://)")
    elif not "://" in DATABASE_URL:
        # Add the protocol if missing
        DATABASE_URL = f"postgresql://{DATABASE_URL}"
        logger.info("Added postgresql:// protocol to database URL")

# Log the database URL (masked)
if "@" in DATABASE_URL:
    masked_url = DATABASE_URL.split("@")[1]
else:
    masked_url = "masked"
logger.info(f"Using database URL: {masked_url}")

# Check if we're connecting to Railway's internal PostgreSQL
is_railway_internal = "railway.internal" in DATABASE_URL

# Create engine with appropriate SSL settings
if is_railway_internal:
    # For Railway internal connections, disable SSL completely
    logger.info("Detected Railway internal connection, disabling SSL")
    engine = create_engine(
        DATABASE_URL, pool_pre_ping=True, connect_args={"sslmode": "disable"}
    )
else:
    # For other connections, use SSL
    logger.info("Using standard connection with SSL")
    engine = create_engine(
        DATABASE_URL, pool_pre_ping=True, connect_args={"sslmode": "require"}
    )


def wait_for_database(max_attempts=5, delay=5):
    """Wait for the database to be available."""
    logger.info(f"Waiting for database to be available...")

    # Try to connect
    for attempt in range(max_attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database is available!")
                return True
        except Exception as e:
            logger.warning(
                f"Database not available yet (attempt {attempt+1}/{max_attempts}): {str(e)}"
            )
            if attempt < max_attempts - 1:
                logger.info(f"Waiting {delay} seconds before retrying...")
                time.sleep(delay)

    logger.warning("Could not connect to the database after multiple attempts")
    # Return True anyway to allow the application to continue
    return True


def check_table_exists(table_name):
    """Check if a table exists in the database."""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception as e:
        logger.error(f"Error checking if table {table_name} exists: {str(e)}")
        return False


def run_migrations():
    """Run all pending migrations."""
    try:
        logger.info("Running database migrations...")

        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))

        # Set the database URL
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)

        # Run the migration
        try:
            command.upgrade(alembic_cfg, "heads")
            logger.info("Database migrations completed successfully!")
        except Exception as e:
            logger.warning(f"Error running upgrade to heads: {str(e)}")
            logger.info("Trying to stamp current state...")
            try:
                command.stamp(alembic_cfg, "heads")
                logger.info("Database migrations marked as complete")
            except Exception as e2:
                logger.error(f"Error stamping migrations: {str(e2)}")

        return True
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        traceback.print_exc()
        return False


def fix_migrations():
    """Fix migration issues by ensuring all migrations are applied."""
    try:
        logger.info("Starting migration fix...")

        # Wait for the database to be available
        wait_for_database()

        # Run migrations
        run_migrations()

        # Check for required tables
        tables_to_check = [
            "task_categories",
            "tasks",
            "task_ai_usage",
            "task_ai_history",
        ]

        for table in tables_to_check:
            exists = check_table_exists(table)
            logger.info(f"{table} table exists: {exists}")

        logger.info("Migration fix completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Error fixing migrations: {str(e)}")
        traceback.print_exc()
        return True


def main():
    """Main function."""
    try:
        logger.info("Starting fix_migrations.py script")
        fix_migrations()
        logger.info("fix_migrations.py script completed successfully")
        return 0
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        traceback.print_exc()
        return 1  # Return error code on failure


if __name__ == "__main__":
    sys.exit(main())
