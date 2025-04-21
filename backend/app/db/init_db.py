from app.db.database import Base, engine
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.db.seed_categories import seed_categories
from sqlalchemy import text

def init_db():
    # Drop existing tables and types
    Base.metadata.drop_all(bind=engine)
    
    # Drop the enum type if it exists
    with engine.connect() as conn:
        conn.execute(text("DROP TYPE IF EXISTS transaction_type CASCADE;"))
        conn.execute(text("CREATE TYPE transaction_type AS ENUM ('income', 'expense');"))
        conn.commit()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Seed initial data
    seed_categories()

if __name__ == "__main__":
    init_db() 