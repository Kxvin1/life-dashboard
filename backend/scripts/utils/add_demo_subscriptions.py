from sqlalchemy import create_engine, text
from app.core.config import settings
from datetime import date, timedelta
import random


def add_demo_subscriptions():
    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Connect to the database
    with engine.connect() as connection:
        # Get demo user ID
        result = connection.execute(
            text("SELECT id FROM users WHERE email = 'demo_user@example.com'")
        )
        user = result.fetchone()

        if not user:
            print("Demo user not found!")
            return

        user_id = user[0]
        print(f"Found demo user with ID: {user_id}")

        # Check if demo user already has subscriptions
        result = connection.execute(
            text(f"SELECT COUNT(*) FROM subscriptions WHERE user_id = {user_id}")
        )
        subscription_count = result.fetchone()[0]

        if subscription_count > 0:
            print(f"Demo user already has {subscription_count} subscriptions")
            # Delete existing subscriptions
            connection.execute(
                text(f"DELETE FROM subscriptions WHERE user_id = {user_id}")
            )
            connection.commit()
            print("Deleted existing subscriptions")

        # Add new subscriptions
        today = date.today()

        # Active subscriptions
        subscriptions = [
            {
                "user_id": user_id,
                "name": "Netflix",
                "amount": 15.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(30, 200)),
                "status": "active",
                "next_payment_date": today + timedelta(days=random.randint(1, 15)),
                "notes": "Standard plan",
            },
            {
                "user_id": user_id,
                "name": "Spotify",
                "amount": 9.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(30, 200)),
                "status": "active",
                "next_payment_date": today + timedelta(days=random.randint(1, 15)),
                "notes": "Premium plan",
            },
            {
                "user_id": user_id,
                "name": "Amazon Prime",
                "amount": 139.00,
                "billing_frequency": "yearly",
                "start_date": today - timedelta(days=random.randint(30, 200)),
                "status": "active",
                "next_payment_date": today + timedelta(days=random.randint(60, 300)),
                "notes": "Annual subscription",
            },
            {
                "user_id": user_id,
                "name": "Gym Membership",
                "amount": 49.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(30, 200)),
                "status": "active",
                "next_payment_date": today + timedelta(days=random.randint(1, 15)),
                "notes": "Fitness Plus",
            },
            {
                "user_id": user_id,
                "name": "Disney+",
                "amount": 7.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(30, 200)),
                "status": "active",
                "next_payment_date": today + timedelta(days=random.randint(16, 28)),
                "notes": "Basic plan",
            },
            {
                "user_id": user_id,
                "name": "Adobe Creative Cloud",
                "amount": 52.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(30, 200)),
                "status": "active",
                "next_payment_date": today + timedelta(days=random.randint(16, 28)),
                "notes": "All apps",
            },
            # Inactive subscriptions
            {
                "user_id": user_id,
                "name": "HBO Max",
                "amount": 14.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(100, 300)),
                "status": "inactive",
                "last_active_date": today - timedelta(days=random.randint(10, 90)),
                "notes": "Cancelled",
            },
            {
                "user_id": user_id,
                "name": "YouTube Premium",
                "amount": 11.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(100, 300)),
                "status": "inactive",
                "last_active_date": today - timedelta(days=random.randint(10, 90)),
                "notes": "Free trial ended",
            },
            {
                "user_id": user_id,
                "name": "Hulu",
                "amount": 12.99,
                "billing_frequency": "monthly",
                "start_date": today - timedelta(days=random.randint(100, 300)),
                "status": "inactive",
                "last_active_date": today - timedelta(days=random.randint(10, 90)),
                "notes": "Switched to bundle",
            },
            # Future subscriptions (starting in 2030)
            {
                "user_id": user_id,
                "name": "Future Tech Pro",
                "amount": 99.99,
                "billing_frequency": "monthly",
                "start_date": date(2030, 1, 1),
                "status": "active",
                "next_payment_date": date(2030, 1, 1),
                "notes": "Future technology subscription",
            },
            {
                "user_id": user_id,
                "name": "AI Assistant Premium",
                "amount": 29.99,
                "billing_frequency": "monthly",
                "start_date": date(2030, 2, 15),
                "status": "active",
                "next_payment_date": date(2030, 2, 15),
                "notes": "Advanced AI features",
            },
        ]

        for sub in subscriptions:
            # Handle NULL values for last_active_date and next_payment_date
            last_active_date = (
                f"'{sub['last_active_date']}'"
                if "last_active_date" in sub and sub["last_active_date"]
                else "NULL"
            )
            next_payment_date = (
                f"'{sub['next_payment_date']}'"
                if "next_payment_date" in sub and sub["next_payment_date"]
                else "NULL"
            )

            # Insert subscription
            sql = f"""
            INSERT INTO subscriptions
            (user_id, name, amount, billing_frequency, start_date, status, next_payment_date, last_active_date, notes)
            VALUES
            ({sub['user_id']}, '{sub['name']}', {sub['amount']}, '{sub['billing_frequency']}',
            '{sub['start_date']}', '{sub['status']}', {next_payment_date}, {last_active_date}, '{sub['notes']}')
            """
            connection.execute(text(sql))

        connection.commit()
        print(f"Added {len(subscriptions)} subscriptions for demo user")


if __name__ == "__main__":
    add_demo_subscriptions()
