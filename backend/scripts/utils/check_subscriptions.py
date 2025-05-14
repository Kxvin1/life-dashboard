from app.db.database import engine
from sqlalchemy import text

def check_subscriptions():
    with engine.connect() as conn:
        result = conn.execute(
            text('''
                SELECT name, amount, billing_frequency, status, next_payment_date 
                FROM subscriptions 
                WHERE user_id = (SELECT id FROM users WHERE email = 'demo_user@example.com')
            ''')
        )
        
        print("Demo user subscriptions:")
        for row in result:
            print(f"{row[0]}: ${row[1]} ({row[2]}) - {row[3]} - Next payment: {row[4]}")

if __name__ == "__main__":
    check_subscriptions()
