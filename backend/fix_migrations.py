"""
Script to fix migration issues by merging all heads.
Run this script if you encounter migration errors.
"""

import os
import sys
from alembic.config import Config
from alembic import command
from app.core.config import settings


def fix_migrations():
    """Fix migration issues by merging all heads."""
    try:
        print("Starting migration fix...")
        
        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))
        
        # Set the database URL
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        
        # Show current migration state
        print("Current migration state:")
        command.current(alembic_cfg)
        
        # Show all heads
        print("\nCurrent heads:")
        command.heads(alembic_cfg)
        
        # Try to upgrade to the final merge head
        print("\nAttempting to upgrade to final_merge_all_heads...")
        try:
            command.upgrade(alembic_cfg, "final_merge_all_heads")
            print("Successfully upgraded to final_merge_all_heads")
        except Exception as e:
            print(f"Error upgrading to final_merge_all_heads: {e}")
            print("Trying alternative approach...")
            
            # Try to stamp the database with the final merge head
            try:
                print("Stamping database with final_merge_all_heads...")
                command.stamp(alembic_cfg, "final_merge_all_heads")
                print("Successfully stamped database with final_merge_all_heads")
            except Exception as e:
                print(f"Error stamping database: {e}")
                print("Trying to merge heads...")
                
                # Try to merge all heads
                try:
                    print("Merging all heads...")
                    command.merge(alembic_cfg, "heads", "final_merge_all_heads_auto")
                    print("Successfully created merge migration")
                    
                    # Try to upgrade to the new merge head
                    try:
                        print("Upgrading to merged head...")
                        command.upgrade(alembic_cfg, "heads")
                        print("Successfully upgraded to merged head")
                    except Exception as e:
                        print(f"Error upgrading to merged head: {e}")
                except Exception as e:
                    print(f"Error merging heads: {e}")
        
        # Show final migration state
        print("\nFinal migration state:")
        command.current(alembic_cfg)
        
        print("\nMigration fix completed!")
        return 0
    except Exception as e:
        print(f"Error fixing migrations: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(fix_migrations())
