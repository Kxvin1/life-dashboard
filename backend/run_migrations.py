import os
import sys
from alembic.config import Config
from alembic import command


def run_migrations():
    """Run database migrations using Alembic."""
    try:
        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))

        # Run the migration
        command.upgrade(alembic_cfg, "heads")

        print("Database migrations completed successfully!")
        return 0
    except Exception as e:
        print(f"Error running migrations: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(run_migrations())
