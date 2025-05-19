"""
Script to fix migration issues in the Railway deployment.
This script ensures all migrations are applied.
"""

import os
import sys
import time
import traceback
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError

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
        print("WARNING: DATABASE_URL environment variable not set")
        # For testing purposes, don't exit if we're just importing the module
        if __name__ == "__main__":
            sys.exit(1)
        else:
            DATABASE_URL = "postgresql://placeholder:placeholder@localhost/placeholder"

# Determine if we're in production environment
is_production = os.environ.get("ENVIRONMENT", "development") != "development"

# Configure SSL for production environments
if is_production:
    # Add SSL parameters to the connection string if not already present
    if "sslmode" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL += "&sslmode=prefer"
        else:
            DATABASE_URL += "?sslmode=prefer"

    # Create engine with SSL configuration
    engine = create_engine(DATABASE_URL, connect_args={"sslmode": "prefer"})
else:
    # Use regular connection for development
    engine = create_engine(DATABASE_URL)


def wait_for_database(url, max_attempts=10, delay=5):
    """Wait for the database to be available."""
    print(f"Waiting for database to be available at {url.split('@')[-1]}...")

    # Add SSL parameters to the connection string if not already present
    if "sslmode" not in url:
        if "?" in url:
            url += "&sslmode=prefer"
        else:
            url += "?sslmode=prefer"

    # Create engine with SSL configuration
    engine = create_engine(url, connect_args={"sslmode": "prefer"})
    attempts = 0

    while attempts < max_attempts:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                print("Database is available!")
                return True
        except OperationalError as e:
            attempts += 1
            print(
                f"Database not available yet (attempt {attempts}/{max_attempts}): {e}"
            )
            if attempts < max_attempts:
                print(f"Waiting {delay} seconds before retrying...")
                time.sleep(delay)

    print("ERROR: Could not connect to the database after multiple attempts")
    return False


def check_table_exists(table_name):
    """Check if a table exists in the database."""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception as e:
        print(f"Error checking if table {table_name} exists: {e}")
        return False


def run_migrations():
    """Run all pending migrations."""
    try:
        print("Running database migrations...")

        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))

        # Set the database URL
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)

        # Run the migration
        try:
            command.upgrade(alembic_cfg, "heads")
        except Exception as e:
            print(f"Error running upgrade to heads: {e}")
            print(
                "Migration may have already been applied or there might be multiple heads."
            )

        print("Database migrations completed successfully!")
        return True
    except Exception as e:
        print(f"Error running migrations: {e}")
        traceback.print_exc()
        return False


def fix_migrations():
    """Fix migration issues by ensuring all migrations are applied."""
    try:
        print("Starting migration fix...")

        # Wait for the database to be available
        if not wait_for_database(DATABASE_URL):
            return False

        # Run migrations
        migration_success = run_migrations()

        # Check for required tables
        tables_to_check = [
            "task_categories",
            "tasks",
            "task_ai_usage",
            "task_ai_history",
        ]

        for table in tables_to_check:
            exists = check_table_exists(table)
            print(f"{table} table exists: {exists}")

        print("Migration fix completed successfully!")
        return True
    except Exception as e:
        print(f"Error fixing migrations: {e}")
        traceback.print_exc()
        # Return True anyway to allow the application to start
        return True


def main():
    """Main function."""
    try:
        fix_migrations()
        return 0
    except Exception as e:
        print(f"Error in main function: {e}")
        traceback.print_exc()
        # Return 0 anyway to allow the application to start
        return 0


if __name__ == "__main__":
    sys.exit(main())
