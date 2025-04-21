from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.transaction import TransactionType
from app.models.category import Category
import asyncio

def seed_categories():
    """Idempotent function to ensure categories exist with correct types"""
    try:
        db = SessionLocal()
        
        # Default expense categories
        expense_categories = [
            {"name": "Housing", "type": TransactionType.expense},
            {"name": "Transportation", "type": TransactionType.expense},
            {"name": "Food", "type": TransactionType.expense},
            {"name": "Utilities", "type": TransactionType.expense},
            {"name": "Health", "type": TransactionType.expense},
            {"name": "Entertainment", "type": TransactionType.expense},
            {"name": "Shopping", "type": TransactionType.expense}
        ]

        # Default income categories
        income_categories = [
            {"name": "Employment", "type": TransactionType.income},
            {"name": "Business", "type": TransactionType.income},
            {"name": "Investment", "type": TransactionType.income},
            {"name": "Rental", "type": TransactionType.income},
            {"name": "Other", "type": TransactionType.income}
        ]

        # Get existing categories
        existing_categories = {cat.name: cat for cat in db.query(Category).all()}
        
        # Update or create categories
        for category_data in expense_categories + income_categories:
            if category_data["name"] in existing_categories:
                # Only update if type is incorrect
                existing_category = existing_categories[category_data["name"]]
                if existing_category.type != category_data["type"]:
                    existing_category.type = category_data["type"]
            else:
                # Create new category
                category = Category(**category_data)
                db.add(category)

        db.commit()
        print("Categories verified/updated successfully")
    except Exception as e:
        print(f"Error verifying/updating categories: {e}")
        db.rollback()
    finally:
        db.close()

async def verify_categories():
    """Async wrapper to run category verification in background"""
    await asyncio.sleep(5)  # Wait 5 seconds after startup
    seed_categories()

if __name__ == "__main__":
    seed_categories() 