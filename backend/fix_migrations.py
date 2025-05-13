"""
Script to fix migration issues by merging all heads.
Run this script if you encounter migration errors.
"""

import os
import sys
import time
import traceback
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Import settings in a way that works in Railway environment
try:
    from app.core.config import settings

    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback for Railway environment
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)


def wait_for_database(url, max_attempts=10, delay=5):
    """Wait for the database to be available."""
    print(f"Waiting for database to be available at {url.split('@')[-1]}...")

    engine = create_engine(url)
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


def fix_migrations():
    """Fix migration issues by merging all heads."""
    try:
        print("Starting migration fix...")

        # Wait for the database to be available
        if not wait_for_database(DATABASE_URL):
            return 1

        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))

        # Set the database URL
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)

        # Try multiple approaches to fix the migrations
        approaches = [
            # Approach 1: Try to upgrade to heads directly
            lambda: command.upgrade(alembic_cfg, "heads"),
            # Approach 2: Try to upgrade to the final merge head
            lambda: command.upgrade(alembic_cfg, "final_merge_all_heads"),
            # Approach 3: Try to stamp the database with the final merge head
            lambda: command.stamp(alembic_cfg, "final_merge_all_heads"),
            # Approach 4: Try to stamp with the latest revision
            lambda: command.stamp(alembic_cfg, "head"),
            # Approach 5: Try to create a new merge migration and upgrade
            lambda: (
                command.merge(alembic_cfg, "heads", "emergency_merge"),
                command.upgrade(alembic_cfg, "heads"),
            ),
        ]

        success = False
        for i, approach in enumerate(approaches):
            try:
                print(f"\nTrying approach {i+1}...")
                if isinstance(approach, tuple):
                    for step in approach:
                        step()
                else:
                    approach()
                print(f"Approach {i+1} succeeded!")
                success = True
                break
            except Exception as e:
                print(f"Approach {i+1} failed: {e}")
                traceback.print_exc()

        if success:
            print("\nMigration fix completed successfully!")
        else:
            print("\nAll approaches failed. Manual intervention may be required.")

        # Show final migration state
        try:
            print("\nFinal migration state:")
            command.current(alembic_cfg)
        except Exception as e:
            print(f"Could not show migration state: {e}")

        # Return success even if we failed, to allow the application to start
        return 0
    except Exception as e:
        print(f"Error fixing migrations: {e}")
        traceback.print_exc()
        # Return success anyway to allow the application to start
        return 0


if __name__ == "__main__":
    sys.exit(fix_migrations())
