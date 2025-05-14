from sqlalchemy import create_engine, text
from app.core.config import settings

def check_database():
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Connect to the database
    with engine.connect() as connection:
        # Check users table
        result = connection.execute(text("SELECT id, email, is_demo_user FROM users WHERE email = 'demo_user@example.com'"))
        users = result.fetchall()
        
        if not users:
            print("Demo user not found in the database!")
            return
        
        demo_user_id = users[0][0]
        print(f"Demo user found with ID: {demo_user_id}")
        
        # Check subscriptions table
        result = connection.execute(
            text(f"SELECT id, name, amount, status FROM subscriptions WHERE user_id = {demo_user_id}")
        )
        subscriptions = result.fetchall()
        
        print(f"Found {len(subscriptions)} subscriptions for demo user:")
        for sub in subscriptions:
            print(f"- {sub[1]} (${sub[2]}) - Status: {sub[3]}")
        
        # Check if create_demo_user_data function is being called
        print("\nChecking if demo user data creation is working:")
        result = connection.execute(
            text(f"SELECT COUNT(*) FROM transactions WHERE user_id = {demo_user_id}")
        )
        transaction_count = result.fetchone()[0]
        print(f"Transaction count for demo user: {transaction_count}")

if __name__ == "__main__":
    check_database()
