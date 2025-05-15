"""
Script to check if the Pomodoro tables exist in the database.
This script is useful for verifying that the fix was applied correctly.

Usage:
    python -m scripts.check_pomodoro_schema
"""

import sys
import os
import logging
from sqlalchemy import inspect, create_engine, text

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get DATABASE_URL from environment or from app settings
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    try:
        # Add the parent directory to the path so we can import from app
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from app.core.config import settings
        DATABASE_URL = settings.DATABASE_URL
    except ImportError:
        logger.error("DATABASE_URL environment variable not set and could not import settings")
        sys.exit(1)

logger.info(f"Using DATABASE_URL: {DATABASE_URL}")

# Create engine
try:
    engine = create_engine(DATABASE_URL)
except Exception as e:
    logger.error(f"Error creating engine: {str(e)}")
    sys.exit(1)

def check_table_exists(table_name):
    """Check if a table exists in the database."""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception as e:
        logger.error(f"Error checking if table {table_name} exists: {str(e)}")
        return False

def check_table_columns(table_name):
    """Check the columns of a table."""
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        return columns
    except Exception as e:
        logger.error(f"Error checking columns for table {table_name}: {str(e)}")
        return []

def check_alembic_version():
    """Check if the Pomodoro migration is in the alembic_version table."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version WHERE version_num = 'add_pomodoro_tables'"))
            migration_exists = result.fetchone() is not None
            return migration_exists
    except Exception as e:
        logger.error(f"Error checking alembic_version table: {str(e)}")
        return False

def main():
    """Main function to check Pomodoro tables."""
    logger.info("Checking Pomodoro tables...")
    
    # Check if tables exist
    pomodoro_sessions_exists = check_table_exists('pomodoro_sessions')
    pomodoro_ai_usage_exists = check_table_exists('pomodoro_ai_usage')
    pomodoro_ai_history_exists = check_table_exists('pomodoro_ai_history')
    
    logger.info(f"Pomodoro tables exist: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}")
    
    # Check if migration is in alembic_version table
    migration_exists = check_alembic_version()
    logger.info(f"Pomodoro migration in alembic_version table: {migration_exists}")
    
    # Check columns for each table
    if pomodoro_sessions_exists:
        columns = check_table_columns('pomodoro_sessions')
        logger.info(f"pomodoro_sessions columns: {[c['name'] for c in columns]}")
    
    if pomodoro_ai_usage_exists:
        columns = check_table_columns('pomodoro_ai_usage')
        logger.info(f"pomodoro_ai_usage columns: {[c['name'] for c in columns]}")
    
    if pomodoro_ai_history_exists:
        columns = check_table_columns('pomodoro_ai_history')
        logger.info(f"pomodoro_ai_history columns: {[c['name'] for c in columns]}")
    
    # Print summary
    if pomodoro_sessions_exists and pomodoro_ai_usage_exists and pomodoro_ai_history_exists and migration_exists:
        logger.info("All Pomodoro tables exist and migration is in alembic_version table.")
        return 0
    else:
        logger.warning("Some Pomodoro tables are missing or migration is not in alembic_version table.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
