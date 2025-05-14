"""
Script to apply a specific migration to the database.
This is useful for applying migrations to production.
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

def apply_migration():
    """Apply the is_demo_user migration to the database."""
    print(f"Applying is_demo_user migration to database: {DATABASE_URL}")
    
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Connect to the database
    with engine.connect() as connection:
        try:
            # Check if the column already exists
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_demo_user'"))
            has_column = result.fetchone() is not None
            
            if has_column:
                print("The 'is_demo_user' column already exists in the users table")
                return
            
            # Add the is_demo_user column
            print("Adding is_demo_user column to users table...")
            connection.execute(text("ALTER TABLE users ADD COLUMN is_demo_user BOOLEAN DEFAULT FALSE"))
            
            # Update existing rows to have is_demo_user=False
            print("Setting is_demo_user=FALSE for all existing users...")
            connection.execute(text("UPDATE users SET is_demo_user = FALSE"))
            
            # Make the column non-nullable
            print("Making is_demo_user column non-nullable...")
            connection.execute(text("ALTER TABLE users ALTER COLUMN is_demo_user SET NOT NULL"))
            
            # Update the alembic_version table
            print("Updating alembic_version table...")
            connection.execute(text("DELETE FROM alembic_version"))
            connection.execute(text("INSERT INTO alembic_version (version_num) VALUES ('add_is_demo_user_field')"))
            
            # Commit the transaction
            connection.commit()
            
            print("Migration applied successfully!")
            
        except Exception as e:
            print(f"Error applying migration: {e}")
            raise

if __name__ == "__main__":
    apply_migration()
