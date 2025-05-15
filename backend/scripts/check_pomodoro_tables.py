"""
Script to check if Pomodoro tables exist and create them if they don't.
This script is intended to be run in the production environment to fix the issue
with the Pomodoro tables not being properly created.
"""

import sys
import os
import logging
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from app.models.pomodoro import PomodoroSession, PomodoroAIUsage, PomodoroAIHistory
from app.models.user import User
from app.db.database import Base

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_table_exists(table_name):
    """Check if a table exists in the database."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def create_pomodoro_tables():
    """Create Pomodoro tables if they don't exist."""
    try:
        # Check if tables exist
        pomodoro_sessions_exists = check_table_exists('pomodoro_sessions')
        pomodoro_ai_usage_exists = check_table_exists('pomodoro_ai_usage')
        pomodoro_ai_history_exists = check_table_exists('pomodoro_ai_history')
        
        logger.info(f"Pomodoro tables exist: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}")
        
        # Create tables if they don't exist
        if not pomodoro_sessions_exists or not pomodoro_ai_usage_exists or not pomodoro_ai_history_exists:
            logger.info("Creating missing Pomodoro tables...")
            
            # Create tables
            Base.metadata.create_all(engine, tables=[
                PomodoroSession.__table__,
                PomodoroAIUsage.__table__,
                PomodoroAIHistory.__table__
            ])
            
            logger.info("Pomodoro tables created successfully.")
        else:
            logger.info("All Pomodoro tables already exist.")
            
        # Verify tables were created
        pomodoro_sessions_exists = check_table_exists('pomodoro_sessions')
        pomodoro_ai_usage_exists = check_table_exists('pomodoro_ai_usage')
        pomodoro_ai_history_exists = check_table_exists('pomodoro_ai_history')
        
        logger.info(f"Pomodoro tables after check/creation: sessions={pomodoro_sessions_exists}, ai_usage={pomodoro_ai_usage_exists}, ai_history={pomodoro_ai_history_exists}")
        
        return True
    except SQLAlchemyError as e:
        logger.error(f"Error creating Pomodoro tables: {str(e)}")
        return False

def check_user_relationship():
    """Check if the User model has the relationship with Pomodoro tables."""
    try:
        # Check if User model has relationship with Pomodoro tables
        user_relationships = [r.key for r in User.__mapper__.relationships]
        
        has_pomodoro_sessions = 'pomodoro_sessions' in user_relationships
        has_pomodoro_ai_usage = 'pomodoro_ai_usage' in user_relationships
        has_pomodoro_ai_history = 'pomodoro_ai_history' in user_relationships
        
        logger.info(f"User relationships: pomodoro_sessions={has_pomodoro_sessions}, pomodoro_ai_usage={has_pomodoro_ai_usage}, pomodoro_ai_history={has_pomodoro_ai_history}")
        
        return has_pomodoro_sessions and has_pomodoro_ai_usage and has_pomodoro_ai_history
    except Exception as e:
        logger.error(f"Error checking User relationships: {str(e)}")
        return False

def main():
    """Main function to check and create Pomodoro tables."""
    logger.info("Starting Pomodoro tables check...")
    
    # Check if tables exist and create them if they don't
    tables_created = create_pomodoro_tables()
    
    if not tables_created:
        logger.error("Failed to create Pomodoro tables.")
        return
    
    # Check if User model has relationship with Pomodoro tables
    relationships_exist = check_user_relationship()
    
    if not relationships_exist:
        logger.warning("User model does not have all relationships with Pomodoro tables.")
    
    logger.info("Pomodoro tables check completed.")

if __name__ == "__main__":
    main()
