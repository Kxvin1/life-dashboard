"""
Emergency script to fix migration issues by directly manipulating the alembic_version table.
Only use this as a last resort if all other approaches fail.
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

# The revision ID to set as the current version
# This should be the latest revision in your migration history
TARGET_REVISION = "final_merge_all_heads"

def emergency_fix():
    """Directly update the alembic_version table to fix migration issues."""
    try:
        print(f"Starting emergency migration fix...")
        print(f"Target revision: {TARGET_REVISION}")
        
        # Create database engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if alembic_version table exists
            result = conn.execute(text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alembic_version')"
            ))
            table_exists = result.scalar()
            
            if not table_exists:
                print("Creating alembic_version table...")
                conn.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
                conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:revision)"), {"revision": TARGET_REVISION})
                conn.commit()
                print(f"Created alembic_version table and set version to {TARGET_REVISION}")
            else:
                # Check current version
                result = conn.execute(text("SELECT version_num FROM alembic_version"))
                current_version = result.scalar()
                print(f"Current version: {current_version}")
                
                # Update to target version
                conn.execute(text("DELETE FROM alembic_version"))
                conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:revision)"), {"revision": TARGET_REVISION})
                conn.commit()
                print(f"Updated version from {current_version} to {TARGET_REVISION}")
        
        print("Emergency fix completed successfully!")
        return 0
    except Exception as e:
        print(f"Error during emergency fix: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(emergency_fix())
