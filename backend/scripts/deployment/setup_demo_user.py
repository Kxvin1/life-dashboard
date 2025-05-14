"""
Deployment script to set up the demo user and its data in production.

This script:
1. Checks if the demo user exists, creates it if not
2. Adds sample transactions and subscriptions for the demo user
3. Uses direct SQL queries to avoid issues with Enum types

Usage:
    python -m scripts.deployment.setup_demo_user

Note: This script should be run after a fresh deployment to ensure the demo user has data.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.security import get_password_hash
from datetime import date, timedelta
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_demo_user():
    """Set up the demo user and its data in the database."""
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Connect to the database
    with engine.connect() as connection:
        # Check if demo user exists
        result = connection.execute(text("SELECT id FROM users WHERE email = 'demo_user@example.com'"))
        user = result.fetchone()
        
        if not user:
            logger.info("Demo user not found. Creating demo user...")
            # Create demo user
            hashed_password = get_password_hash("demo_password")
            sql = f"""
            INSERT INTO users (email, hashed_password, full_name, is_demo_user)
            VALUES ('demo_user@example.com', '{hashed_password}', 'Demo User', TRUE)
            RETURNING id
            """
            result = connection.execute(text(sql))
            user = result.fetchone()
            connection.commit()
            logger.info(f"Created demo user with ID: {user[0]}")
        
        user_id = user[0]
        logger.info(f"Using demo user with ID: {user_id}")
        
        # Check if demo user already has transactions
        result = connection.execute(
            text(f"SELECT COUNT(*) FROM transactions WHERE user_id = {user_id}")
        )
        transaction_count = result.fetchone()[0]
        
        if transaction_count > 0:
            logger.info(f"Demo user already has {transaction_count} transactions")
            # Delete existing transactions
            connection.execute(text(f"DELETE FROM transactions WHERE user_id = {user_id}"))
            connection.commit()
            logger.info("Deleted existing transactions")
        
        # Check if demo user already has subscriptions
        result = connection.execute(
            text(f"SELECT COUNT(*) FROM subscriptions WHERE user_id = {user_id}")
        )
        subscription_count = result.fetchone()[0]
        
        if subscription_count > 0:
            logger.info(f"Demo user already has {subscription_count} subscriptions")
            # Delete existing subscriptions
            connection.execute(text(f"DELETE FROM subscriptions WHERE user_id = {user_id}"))
            connection.commit()
            logger.info("Deleted existing subscriptions")
        
        # Create sample data
        create_sample_transactions(connection, user_id)
        create_sample_subscriptions(connection, user_id)
        
        logger.info("Demo user setup complete!")

def create_sample_transactions(connection, user_id):
    """Create sample transactions for the demo user."""
    logger.info("Creating sample transactions...")
    
    # Get or create categories
    income_categories = ensure_categories(connection, [
        "Salary", "Freelance", "Investment", "Other"
    ], "income")
    
    expense_categories = ensure_categories(connection, [
        "Housing", "Food", "Transportation", "Utilities", 
        "Entertainment", "Shopping", "Health"
    ], "expense")
    
    # Create transactions for the past 8 months
    today = date.today()
    transactions = []
    
    # Payment methods
    payment_methods = ["cash", "credit_card", "debit_card", "bank_transfer"]
    
    # Create income transactions (2-3 per month)
    for month_offset in range(8):
        month_date = today.replace(day=1) - timedelta(days=month_offset * 30)
        
        # Regular salary (around the 1st of each month)
        salary_date = month_date.replace(day=random.randint(1, 5))
        salary_amount = random.uniform(3000, 4000)
        
        sql = f"""
        INSERT INTO transactions 
        (user_id, amount, description, date, type, payment_method, category_id)
        VALUES 
        ({user_id}, {salary_amount}, 'Monthly Salary', '{salary_date}', 'income', 
        'bank_transfer', {random.choice(income_categories)})
        """
        connection.execute(text(sql))
        
        # Occasional freelance income
        if random.random() > 0.3:  # 70% chance of freelance income
            freelance_date = month_date.replace(day=random.randint(10, 25))
            freelance_amount = random.uniform(500, 1500)
            
            sql = f"""
            INSERT INTO transactions 
            (user_id, amount, description, date, type, payment_method, category_id)
            VALUES 
            ({user_id}, {freelance_amount}, 'Freelance Project', '{freelance_date}', 'income', 
            '{random.choice(payment_methods)}', {random.choice(income_categories)})
            """
            connection.execute(text(sql))
    
    # Create expense transactions (15-25 per month)
    for month_offset in range(8):
        month_date = today.replace(day=1) - timedelta(days=month_offset * 30)
        month_days = 30  # Simplified
        
        # Number of expenses this month
        num_expenses = random.randint(15, 25)
        
        for _ in range(num_expenses):
            expense_date = month_date.replace(day=random.randint(1, month_days))
            expense_amount = random.uniform(10, 500)
            category_id = random.choice(expense_categories)
            
            # Generate description based on category
            descriptions = {
                "Housing": ["Rent", "Mortgage", "Utilities", "Home Insurance"],
                "Food": ["Grocery Shopping", "Restaurant", "Coffee Shop", "Food Delivery"],
                "Transportation": ["Gas", "Public Transit", "Uber/Lyft", "Car Maintenance"],
                "Utilities": ["Electricity", "Water", "Internet", "Phone Bill"],
                "Entertainment": ["Movie Tickets", "Concert", "Streaming Service", "Video Games"],
                "Shopping": ["Clothing", "Electronics", "Home Goods", "Online Shopping"],
                "Health": ["Doctor Visit", "Medication", "Gym Membership", "Health Insurance"]
            }
            
            # Get category name
            result = connection.execute(text(f"SELECT name FROM categories WHERE id = {category_id}"))
            category_name = result.fetchone()[0]
            
            # Get description based on category
            if category_name in descriptions:
                description = random.choice(descriptions[category_name])
            else:
                description = "Miscellaneous Expense"
            
            sql = f"""
            INSERT INTO transactions 
            (user_id, amount, description, date, type, payment_method, category_id)
            VALUES 
            ({user_id}, {expense_amount}, '{description}', '{expense_date}', 'expense', 
            '{random.choice(payment_methods)}', {category_id})
            """
            connection.execute(text(sql))
    
    connection.commit()
    logger.info("Sample transactions created successfully")

def ensure_categories(connection, category_names, type_name):
    """Ensure categories exist and return their IDs."""
    category_ids = []
    
    for name in category_names:
        # Check if category exists
        result = connection.execute(
            text(f"SELECT id FROM categories WHERE name = '{name}' AND type = '{type_name}'")
        )
        category = result.fetchone()
        
        if not category:
            # Create category
            sql = f"""
            INSERT INTO categories (name, type)
            VALUES ('{name}', '{type_name}')
            RETURNING id
            """
            result = connection.execute(text(sql))
            category = result.fetchone()
            connection.commit()
        
        category_ids.append(category[0])
    
    return category_ids

def create_sample_subscriptions(connection, user_id):
    """Create sample subscriptions for the demo user."""
    logger.info("Creating sample subscriptions...")
    
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
            "notes": "Standard plan"
        },
        {
            "user_id": user_id,
            "name": "Spotify",
            "amount": 9.99,
            "billing_frequency": "monthly",
            "start_date": today - timedelta(days=random.randint(30, 200)),
            "status": "active",
            "next_payment_date": today + timedelta(days=random.randint(1, 15)),
            "notes": "Premium plan"
        },
        {
            "user_id": user_id,
            "name": "Amazon Prime",
            "amount": 139.00,
            "billing_frequency": "yearly",
            "start_date": today - timedelta(days=random.randint(30, 200)),
            "status": "active",
            "next_payment_date": today + timedelta(days=random.randint(60, 300)),
            "notes": "Annual subscription"
        },
        {
            "user_id": user_id,
            "name": "Gym Membership",
            "amount": 49.99,
            "billing_frequency": "monthly",
            "start_date": today - timedelta(days=random.randint(30, 200)),
            "status": "active",
            "next_payment_date": today + timedelta(days=random.randint(1, 15)),
            "notes": "Fitness Plus"
        },
        {
            "user_id": user_id,
            "name": "Disney+",
            "amount": 7.99,
            "billing_frequency": "monthly",
            "start_date": today - timedelta(days=random.randint(30, 200)),
            "status": "active",
            "next_payment_date": today + timedelta(days=random.randint(16, 28)),
            "notes": "Basic plan"
        },
        {
            "user_id": user_id,
            "name": "Adobe Creative Cloud",
            "amount": 52.99,
            "billing_frequency": "monthly",
            "start_date": today - timedelta(days=random.randint(30, 200)),
            "status": "active",
            "next_payment_date": today + timedelta(days=random.randint(16, 28)),
            "notes": "All apps"
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
            "notes": "Cancelled"
        },
        {
            "user_id": user_id,
            "name": "YouTube Premium",
            "amount": 11.99,
            "billing_frequency": "monthly",
            "start_date": today - timedelta(days=random.randint(100, 300)),
            "status": "inactive",
            "last_active_date": today - timedelta(days=random.randint(10, 90)),
            "notes": "Free trial ended"
        },
        {
            "user_id": user_id,
            "name": "Hulu",
            "amount": 12.99,
            "billing_frequency": "monthly",
            "start_date": today - timedelta(days=random.randint(100, 300)),
            "status": "inactive",
            "last_active_date": today - timedelta(days=random.randint(10, 90)),
            "notes": "Switched to bundle"
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
            "notes": "Future technology subscription"
        },
        {
            "user_id": user_id,
            "name": "AI Assistant Premium",
            "amount": 29.99,
            "billing_frequency": "monthly",
            "start_date": date(2030, 2, 15),
            "status": "active",
            "next_payment_date": date(2030, 2, 15),
            "notes": "Advanced AI features"
        }
    ]
    
    for sub in subscriptions:
        # Handle NULL values for last_active_date and next_payment_date
        last_active_date = f"'{sub['last_active_date']}'" if 'last_active_date' in sub and sub['last_active_date'] else "NULL"
        next_payment_date = f"'{sub['next_payment_date']}'" if 'next_payment_date' in sub and sub['next_payment_date'] else "NULL"
        
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
    logger.info(f"Added {len(subscriptions)} subscriptions for demo user")

if __name__ == "__main__":
    setup_demo_user()
