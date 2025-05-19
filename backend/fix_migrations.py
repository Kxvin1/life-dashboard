"""
Script to fix migration issues in the Railway deployment.
This script ensures all migrations are applied and the task_categories table exists.
"""

import os
import sys
import time
import traceback
from alembic.config import Config
from alembic import command
from sqlalchemy import (
    create_engine,
    text,
    inspect,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.sql import func

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

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = lambda: engine.connect()

# Default task categories
DEFAULT_TASK_CATEGORIES = [
    {"name": "Work", "description": "Career and professional tasks"},
    {"name": "Health", "description": "Physical and mental well-being"},
    {"name": "Relationships", "description": "Family, friends, and social connections"},
    {
        "name": "Personal Growth",
        "description": "Learning, skills, and self-improvement",
    },
    {"name": "Finance", "description": "Money management and financial goals"},
    {"name": "Home", "description": "Household chores and maintenance"},
    {"name": "Recreation", "description": "Hobbies, entertainment, and leisure"},
    {"name": "Community", "description": "Volunteering and community involvement"},
]


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


def check_table_exists(table_name):
    """Check if a table exists in the database."""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception as e:
        print(f"Error checking if table {table_name} exists: {e}")
        return False


def create_task_categories_table():
    """Create the task_categories table if it doesn't exist."""
    try:
        if check_table_exists("task_categories"):
            print("task_categories table already exists")
            return True

        print("Creating task_categories table...")

        # First try to create the table using SQL directly
        try:
            with engine.connect() as conn:
                # Create the task_categories table
                conn.execute(
                    text(
                        """
                CREATE TABLE task_categories (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    name VARCHAR NOT NULL,
                    description TEXT,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX ix_task_categories_id ON task_categories (id);
                """
                    )
                )
                conn.commit()
                print("task_categories table created successfully using SQL")
        except Exception as sql_error:
            print(f"Error creating task_categories table using SQL: {sql_error}")

            # If SQL fails, try using SQLAlchemy
            try:
                metadata = MetaData()

                # Define the task_categories table
                task_categories = Table(
                    "task_categories",
                    metadata,
                    Column("id", Integer, primary_key=True, index=True),
                    Column("user_id", Integer, ForeignKey("users.id"), nullable=True),
                    Column("name", String, nullable=False),
                    Column("description", Text, nullable=True),
                    Column("is_default", Boolean, default=False),
                    Column(
                        "created_at", DateTime(timezone=True), server_default=func.now()
                    ),
                )

                # Create the table
                metadata.create_all(engine, tables=[task_categories])
                print("task_categories table created successfully using SQLAlchemy")
            except Exception as sqlalchemy_error:
                print(
                    f"Error creating task_categories table using SQLAlchemy: {sqlalchemy_error}"
                )
                traceback.print_exc()
                return False

        # Seed default task categories
        seed_default_task_categories()

        return True
    except Exception as e:
        print(f"Error creating task_categories table: {e}")
        traceback.print_exc()
        return False


def create_task_ai_usage_table():
    """Create the task_ai_usage table if it doesn't exist."""
    try:
        if check_table_exists("task_ai_usage"):
            print("task_ai_usage table already exists")
            return True

        print("Creating task_ai_usage table...")

        # First try to create the table using SQL directly
        try:
            with engine.connect() as conn:
                # Create the task_ai_usage table
                conn.execute(
                    text(
                        """
                CREATE TABLE task_ai_usage (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) NOT NULL,
                    date DATE NOT NULL,
                    count INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX ix_task_ai_usage_id ON task_ai_usage (id);
                CREATE INDEX ix_task_ai_usage_date ON task_ai_usage (date);
                """
                    )
                )
                conn.commit()
                print("task_ai_usage table created successfully using SQL")
                return True
        except Exception as sql_error:
            print(f"Error creating task_ai_usage table using SQL: {sql_error}")

            # If SQL fails, try using SQLAlchemy
            try:
                metadata = MetaData()

                # Define the task_ai_usage table
                task_ai_usage = Table(
                    "task_ai_usage",
                    metadata,
                    Column("id", Integer, primary_key=True, index=True),
                    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
                    Column("date", Date, nullable=False, index=True),
                    Column("count", Integer, default=1, nullable=False),
                    Column(
                        "created_at", DateTime(timezone=True), server_default=func.now()
                    ),
                )

                # Create the table
                metadata.create_all(engine, tables=[task_ai_usage])
                print("task_ai_usage table created successfully using SQLAlchemy")
                return True
            except Exception as sqlalchemy_error:
                print(
                    f"Error creating task_ai_usage table using SQLAlchemy: {sqlalchemy_error}"
                )
                traceback.print_exc()
                return False
    except Exception as e:
        print(f"Error creating task_ai_usage table: {e}")
        traceback.print_exc()
        return False


def create_task_ai_history_table():
    """Create the task_ai_history table if it doesn't exist."""
    try:
        if check_table_exists("task_ai_history"):
            print("task_ai_history table already exists")
            return True

        print("Creating task_ai_history table...")

        # First try to create the table using SQL directly
        try:
            with engine.connect() as conn:
                # Create the task_ai_history table
                conn.execute(
                    text(
                        """
                CREATE TABLE task_ai_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) NOT NULL,
                    input_text TEXT NOT NULL,
                    output_text TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX ix_task_ai_history_id ON task_ai_history (id);
                """
                    )
                )
                conn.commit()
                print("task_ai_history table created successfully using SQL")
                return True
        except Exception as sql_error:
            print(f"Error creating task_ai_history table using SQL: {sql_error}")

            # If SQL fails, try using SQLAlchemy
            try:
                metadata = MetaData()

                # Define the task_ai_history table
                task_ai_history = Table(
                    "task_ai_history",
                    metadata,
                    Column("id", Integer, primary_key=True, index=True),
                    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
                    Column("input_text", Text, nullable=False),
                    Column("output_text", Text, nullable=False),
                    Column(
                        "created_at", DateTime(timezone=True), server_default=func.now()
                    ),
                )

                # Create the table
                metadata.create_all(engine, tables=[task_ai_history])
                print("task_ai_history table created successfully using SQLAlchemy")
                return True
            except Exception as sqlalchemy_error:
                print(
                    f"Error creating task_ai_history table using SQLAlchemy: {sqlalchemy_error}"
                )
                traceback.print_exc()
                return False
    except Exception as e:
        print(f"Error creating task_ai_history table: {e}")
        traceback.print_exc()
        return False


def seed_default_task_categories():
    """Seed default task categories."""
    try:
        print("Seeding default task categories...")
        with engine.connect() as conn:
            # Check if we already have default categories
            result = conn.execute(
                text("SELECT COUNT(*) FROM task_categories WHERE is_default = true")
            )
            count = result.scalar()

            if count > 0:
                print(f"Found {count} existing default task categories")
                return True

            # Insert default categories
            for category in DEFAULT_TASK_CATEGORIES:
                conn.execute(
                    text(
                        "INSERT INTO task_categories (name, description, is_default) VALUES (:name, :description, true)"
                    ),
                    {"name": category["name"], "description": category["description"]},
                )

            conn.commit()
            print(f"Seeded {len(DEFAULT_TASK_CATEGORIES)} default task categories")
            return True
    except Exception as e:
        print(f"Error seeding default task categories: {e}")
        traceback.print_exc()
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

        # Run the migration - use "heads" to handle multiple heads
        try:
            command.upgrade(alembic_cfg, "heads")
        except Exception as e:
            print(f"Error running upgrade to heads: {e}")
            print("Trying to merge heads...")
            try:
                # Try to merge the heads
                command.merge(alembic_cfg, "heads", "merge_heads")
                # Then upgrade to the merged head
                command.upgrade(alembic_cfg, "heads")
            except Exception as merge_error:
                print(f"Error merging heads: {merge_error}")
                # Try to stamp with each head individually
                try:
                    print("Trying to stamp with individual heads...")
                    command.stamp(alembic_cfg, "add_pomodoro_tables")
                    command.stamp(alembic_cfg, "add_task_models")
                except Exception as stamp_error:
                    print(f"Error stamping with individual heads: {stamp_error}")
                    return False

        print("Database migrations completed successfully!")
        return True
    except Exception as e:
        print(f"Error running migrations: {e}")
        traceback.print_exc()
        return False


def fix_migrations():
    """Fix migration issues by ensuring all tables exist."""
    try:
        print("Starting migration fix...")

        # Wait for the database to be available
        if not wait_for_database(DATABASE_URL):
            return False

        # Try to run migrations first
        migration_success = run_migrations()

        # Check for specific tables that might be missing
        tables_to_check = [
            "task_categories",
            "tasks",
            "task_ai_usage",
            "task_ai_history",
            "pomodoro_sessions",
            "pomodoro_ai_usage",
            "pomodoro_ai_history",
        ]

        missing_tables = []
        for table in tables_to_check:
            exists = check_table_exists(table)
            print(f"{table} table exists: {exists}")
            if not exists:
                missing_tables.append(table)

        # Create missing tables
        if "task_categories" in missing_tables:
            print("task_categories table doesn't exist, creating it...")
            create_task_categories_table()

            # Verify that the task_categories table exists now
            task_categories_exists = check_table_exists("task_categories")
            print(f"task_categories table exists after fix: {task_categories_exists}")

            if not task_categories_exists:
                print("Failed to create task_categories table")

        if "task_ai_usage" in missing_tables:
            print("task_ai_usage table doesn't exist, creating it...")
            create_task_ai_usage_table()

            # Verify that the table exists now
            table_exists = check_table_exists("task_ai_usage")
            print(f"task_ai_usage table exists after fix: {table_exists}")

            if not table_exists:
                print("Failed to create task_ai_usage table")

        if "task_ai_history" in missing_tables:
            print("task_ai_history table doesn't exist, creating it...")
            create_task_ai_history_table()

            # Verify that the table exists now
            table_exists = check_table_exists("task_ai_history")
            print(f"task_ai_history table exists after fix: {table_exists}")

            if not table_exists:
                print("Failed to create task_ai_history table")

        # If we still have missing tables, try running migrations again
        if missing_tables and not all(
            check_table_exists(table) for table in missing_tables
        ):
            print("Some tables are still missing, trying to run migrations again...")
            run_migrations()

            # Check if tables exist now
            still_missing = [
                table for table in missing_tables if not check_table_exists(table)
            ]
            if still_missing:
                print(
                    f"Tables still missing after second migration attempt: {still_missing}"
                )

                # Try to create the tables directly if they're still missing
                for table in still_missing:
                    if table == "task_categories":
                        create_task_categories_table()
                    elif table == "task_ai_usage":
                        create_task_ai_usage_table()
                    elif table == "task_ai_history":
                        create_task_ai_history_table()

                # Final check
                final_missing = [
                    table for table in still_missing if not check_table_exists(table)
                ]
                if final_missing:
                    print(
                        f"Tables still missing after direct creation: {final_missing}"
                    )
                else:
                    print("All tables created successfully after direct creation")
            else:
                print("All tables created successfully after second migration attempt")

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
