from app.db.database import SessionLocal
from app.models.user import User
from app.models.transaction import Transaction

def show_database_contents():
    db = SessionLocal()
    try:
        # Show users
        print("\n=== Users ===")
        users = db.query(User).all()
        for user in users:
            print(f"ID: {user.id}, Email: {user.email}, Name: {user.full_name}")

        # Show transactions
        print("\n=== Transactions ===")
        transactions = db.query(Transaction).all()
        for transaction in transactions:
            print(f"ID: {transaction.id}, Amount: {transaction.amount}, Type: {transaction.type}, "
                  f"Description: {transaction.description}, User ID: {transaction.user_id}")

    finally:
        db.close()

if __name__ == "__main__":
    show_database_contents() 