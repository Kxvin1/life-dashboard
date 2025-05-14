"""
Script to check the current migration version in the database.
This is useful for debugging migration issues in production.
"""

import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    try:
        from app.core.config import settings
        DATABASE_URL = settings.DATABASE_URL
    except ImportError:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

def check_migrations():
    """Check the current migration version in the database."""
    print(f"Checking migrations for database: {DATABASE_URL}")
    
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Connect to the database
    with engine.connect() as connection:
        # Check if alembic_version table exists
        try:
            result = connection.execute(text("SELECT version_num FROM alembic_version"))
            versions = result.fetchall()
            
            if not versions:
                print("No migration versions found in alembic_version table")
            else:
                print("Current migration versions:")
                for version in versions:
                    print(f"  - {version[0]}")
                    
            # Check if users table has is_demo_user column
            try:
                result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_demo_user'"))
                has_column = result.fetchone() is not None
                
                if has_column:
                    print("\nThe 'is_demo_user' column exists in the users table")
                else:
                    print("\nThe 'is_demo_user' column does NOT exist in the users table")
                    
                # Show all columns in users table
                result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"))
                columns = result.fetchall()
                
                print("\nColumns in users table:")
                for column in columns:
                    print(f"  - {column[0]}")
                    
            except Exception as e:
                print(f"Error checking users table: {e}")
                
        except Exception as e:
            print(f"Error checking migrations: {e}")

if __name__ == "__main__":
    check_migrations()
