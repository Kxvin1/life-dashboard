from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.transaction import TransactionType
from app.models.category import Category

def seed_categories():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
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

        all_categories = expense_categories + income_categories
        existing_categories = {cat.name: cat for cat in db.query(Category).all()}
        
        # Add or update categories
        for category_data in all_categories:
            if category_data["name"] in existing_categories:
                # Update existing category
                existing_category = existing_categories[category_data["name"]]
                existing_category.type = category_data["type"]
            else:
                # Add new category
                category = Category(**category_data)
                db.add(category)

        db.commit()
        print("Successfully updated categories")
    except Exception as e:
        print(f"Error updating categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories() 