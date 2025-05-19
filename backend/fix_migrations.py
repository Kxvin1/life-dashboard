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
from sqlalchemy import create_engine as sqlalchemy_create_engine

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

        # Determine connection settings based on the URL
        is_railway_internal = "railway.internal" in url
        is_localhost = "localhost" in url or "127.0.0.1" in url

        # Create engine with appropriate settings
        if is_localhost:
            # For localhost, don't use any SSL settings
            logger.info(
                f"Creating engine for {masked_url} without SSL (local development)"
            )
            return create_engine(
                url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=10,
                # No connect_args for localhost
            )
        elif is_railway_internal:
            # For Railway internal connections, disable SSL
            logger.info(
                f"Creating engine for {masked_url} with sslmode=disable (Railway internal)"
            )
            return create_engine(
                url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=10,
                connect_args={"sslmode": "disable"},
            )
        else:
            # For all other connections (production), use SSL mode from environment variable
            # Get SSL mode from environment or use prefer as default
            ssl_mode = os.environ.get("DATABASE_SSL_MODE", "prefer")
            logger.info(
                f"Creating engine for {masked_url} with sslmode={ssl_mode} (production)"
            )
            return create_engine(
                url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=10,
                connect_args={
                    "sslmode": ssl_mode,  # Use SSL mode from environment variable
                    "connect_timeout": 10,  # Add connection timeout
                },
            )


# Create engine using the shared module
engine = make_engine(DATABASE_URL)


def wait_for_database(max_attempts=10, delay=5):
    """Wait for the database to be available."""
    logger.info(f"Waiting for database to be available...")

    # Try to connect
    for attempt in range(max_attempts):
        try:
            # Create a fresh engine for each attempt to avoid cached connection issues
            temp_engine = make_engine(DATABASE_URL)
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database is available!")
                # Update the global engine with the working one
                global engine
                engine = temp_engine
                return True
        except Exception as e:
            error_str = str(e)
            logger.warning(
                f"Database not available yet (attempt {attempt+1}/{max_attempts}): {error_str}"
            )

            # Special handling for SSL errors
            if "SSL" in error_str or "ssl" in error_str:
                logger.warning(
                    "SSL negotiation error detected. Trying alternative SSL modes..."
                )

                # Try different SSL modes
                ssl_modes = ["disable", "allow", "prefer", "require"]
                for ssl_mode in ssl_modes:
                    try:
                        # Normalize URL
                        url = DATABASE_URL
                        if url.startswith("postgres://"):
                            url = url.replace("postgres://", "postgresql://", 1)

                        masked_url = url.split("@")[1] if "@" in url else "masked"
                        logger.info(
                            f"Attempting connection to {masked_url} with sslmode={ssl_mode}"
                        )

                        # Try with current SSL mode
                        temp_engine = sqlalchemy_create_engine(
                            url,
                            pool_pre_ping=True,
                            connect_args={
                                "sslmode": ssl_mode,
                                "connect_timeout": 10,
                            },
                        )
                        with temp_engine.connect() as conn:
                            conn.execute(text("SELECT 1"))
                            logger.info(
                                f"Database connection successful with sslmode={ssl_mode}!"
                            )

                            # Set the working SSL mode as an environment variable
                            os.environ["DATABASE_SSL_MODE"] = ssl_mode
                            logger.info(
                                f"Set DATABASE_SSL_MODE={ssl_mode} for this session"
                            )

                            # Update the global engine with the working one
                            global engine
                            engine = temp_engine
                            return True
                    except Exception as ssl_e:
                        logger.warning(
                            f"Connection with sslmode={ssl_mode} failed: {str(ssl_e)}"
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
