"""
Script to run the Pomodoro tables migration.
This script is intended to be run in the production environment to fix the issue
with the Pomodoro tables not being properly created.
"""

import sys
import os
import logging
import subprocess
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_table_exists(table_name):
    """Check if a table exists in the database."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def run_migration():
    """Run the Pomodoro tables migration."""
    try:
        # Check if tables exist
        pomodoro_sessions_exists = check_table_exists('pomodoro_sessions')
        pomodoro_ai_usage_exists = check_table_exists('pomodoro_ai_usage')
        pomodoro_ai_history_exists = check_table_exists('pomodoro_ai_history')
        
        logger.info(f"Pomodoro tables exist: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}")
        
        # Run the migration if any of the tables don't exist
        if not pomodoro_sessions_exists or not pomodoro_ai_usage_exists or not pomodoro_ai_history_exists:
            logger.info("Running Pomodoro tables migration...")
            
            # Run the migration
            result = subprocess.run(['alembic', 'upgrade', 'head'], capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("Migration successful.")
                logger.info(f"Output: {result.stdout}")
            else:
                logger.error(f"Migration failed with return code {result.returncode}.")
                logger.error(f"Error: {result.stderr}")
                return False
            
            # Verify tables were created
            pomodoro_sessions_exists = check_table_exists('pomodoro_sessions')
            pomodoro_ai_usage_exists = check_table_exists('pomodoro_ai_usage')
            pomodoro_ai_history_exists = check_table_exists('pomodoro_ai_history')
            
            logger.info(f"Pomodoro tables after migration: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}")
            
            return pomodoro_sessions_exists and pomodoro_ai_usage_exists and pomodoro_ai_history_exists
        else:
            logger.info("All Pomodoro tables already exist. No migration needed.")
            return True
    except Exception as e:
        logger.error(f"Error running migration: {str(e)}")
        return False

def main():
    """Main function to run the Pomodoro tables migration."""
    logger.info("Starting Pomodoro tables migration...")
    
    # Run the migration
    success = run_migration()
    
    if success:
        logger.info("Pomodoro tables migration completed successfully.")
    else:
        logger.error("Pomodoro tables migration failed.")

if __name__ == "__main__":
    main()
