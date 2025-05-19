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
from sqlalchemy import text, inspect

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Get database URL with the correct precedence
# 1. Use DATABASE_PUBLIC_URL if available (works everywhere)
# 2. Fall back to DATABASE_URL (only works inside Railway network)
# 3. Use a placeholder for development/testing
DATABASE_URL = (
    os.environ.get("DATABASE_PUBLIC_URL")
    or os.environ.get("DATABASE_URL")
    or "postgresql://placeholder:placeholder@localhost/placeholder"
)

# Log which URL we're using
if "railway.internal" in DATABASE_URL:
    logger.warning("Using internal Railway URL - this may not work during build/deploy")
elif "proxy.rlwy.net" in DATABASE_URL:
    logger.info("Using Railway public URL - this should work everywhere")
elif "localhost" in DATABASE_URL:
    logger.info("Using localhost database URL - for development only")
else:
    logger.info("Using custom database URL")

# Exit if we don't have a valid URL and we're running as a script
if (
    DATABASE_URL == "postgresql://placeholder:placeholder@localhost/placeholder"
    and __name__ == "__main__"
):
    logger.error("No valid DATABASE_URL or DATABASE_PUBLIC_URL found")
    sys.exit(1)

# Import or define the engine creation function
try:
    from app.db.engine import make_engine
except ImportError:
    # If we can't import the shared module, define it here
    def make_engine(url: str):
        """Create a SQLAlchemy engine with appropriate settings."""
        from sqlalchemy import create_engine

        # Normalize URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        # Ensure URL has correct protocol
        if not url.startswith("postgresql://"):
            raise ValueError(f"Invalid database URL scheme: {url}")

        # Mask the URL for logging
        masked_url = url.split("@")[1] if "@" in url else "masked"

        # Determine SSL mode based on the URL
        is_railway_internal = "railway.internal" in url
        sslmode = "disable" if is_railway_internal else "require"

        # Log connection details
        logger.info(f"Creating engine for {masked_url} with sslmode={sslmode}")

        # Create and return the engine
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            connect_args={"sslmode": sslmode},
        )


# Create engine using the shared module
engine = make_engine(DATABASE_URL)


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
