from sqlalchemy.orm import Session
from app.models.task import TaskCategory
from app.db.database import SessionLocal
import logging
import asyncio

logger = logging.getLogger(__name__)

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


def seed_task_categories(db: Session) -> None:
    """
    Seed default task categories if they don't exist
    """
    logger.info("Checking if task categories need to be seeded...")

    # Check if we already have default categories
    existing_categories = (
        db.query(TaskCategory).filter(TaskCategory.is_default == True).all()
    )

    if existing_categories:
        logger.info(
            f"Found {len(existing_categories)} existing default task categories"
        )
        return

    # Create default categories
    for category_data in DEFAULT_TASK_CATEGORIES:
        category = TaskCategory(
            name=category_data["name"],
            description=category_data["description"],
            is_default=True,
        )
        db.add(category)

    db.commit()
    logger.info(f"Seeded {len(DEFAULT_TASK_CATEGORIES)} default task categories")


def verify_task_categories(db: Session) -> None:
    """
    Verify that all default task categories exist, add any missing ones
    """
    logger.info("Verifying default task categories...")

    # Get existing default categories
    existing_categories = {
        cat.name: cat
        for cat in db.query(TaskCategory).filter(TaskCategory.is_default == True).all()
    }

    # Check for missing categories
    missing_categories = []
    for category_data in DEFAULT_TASK_CATEGORIES:
        if category_data["name"] not in existing_categories:
            missing_categories.append(category_data)

    # Add missing categories
    if missing_categories:
        for category_data in missing_categories:
            category = TaskCategory(
                name=category_data["name"],
                description=category_data["description"],
                is_default=True,
            )
            db.add(category)

        db.commit()
        logger.info(f"Added {len(missing_categories)} missing default task categories")
    else:
        logger.info("All default task categories are present")


async def verify_task_categories_async() -> None:
    """Run verify_task_categories in the background."""
    try:
        async with asyncio.to_thread(SessionLocal) as db:
            verify_task_categories(db)
    except Exception as e:
        logger.error(f"verify_task_categories failed: {e}")
