#!/usr/bin/env python3
"""
Check user 10's data to find what's causing the 500 error.
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

def connect_to_db():
    """Connect to the production database."""
    database_url = os.environ.get("DATABASE_PUBLIC_URL") or os.environ.get("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found. Run: railway variables")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        print("✅ Connected to database")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def check_user_data(conn):
    """Check user 10's data for issues."""
    cursor = conn.cursor()
    
    print("🔍 Checking User 10's Data")
    print("=" * 30)
    
    # Check if user exists
    cursor.execute("SELECT id, email FROM users WHERE id = 10")
    user = cursor.fetchone()
    if user:
        print(f"✅ User found: {user['email']}")
    else:
        print("❌ User 10 not found!")
        return
    
    # Check transaction count
    cursor.execute("SELECT COUNT(*) as count FROM transactions WHERE user_id = 10")
    count = cursor.fetchone()['count']
    print(f"📊 User 10 has {count} transactions")
    
    # Check for problematic transactions
    cursor.execute("""
        SELECT id, amount, description, date, type, category_id, is_recurring
        FROM transactions 
        WHERE user_id = 10 
        AND (amount IS NULL OR date IS NULL OR type IS NULL)
        LIMIT 5
    """)
    bad_transactions = cursor.fetchall()
    
    if bad_transactions:
        print(f"❌ Found {len(bad_transactions)} transactions with NULL values:")
        for txn in bad_transactions:
            print(f"   ID {txn['id']}: amount={txn['amount']}, date={txn['date']}, type={txn['type']}")
    else:
        print("✅ No transactions with NULL values")
    
    # Check for invalid category references
    cursor.execute("""
        SELECT t.id, t.category_id 
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.id 
        WHERE t.user_id = 10 
        AND t.category_id IS NOT NULL 
        AND c.id IS NULL
        LIMIT 5
    """)
    invalid_categories = cursor.fetchall()
    
    if invalid_categories:
        print(f"❌ Found {len(invalid_categories)} transactions with invalid category references:")
        for txn in invalid_categories:
            print(f"   Transaction ID {txn['id']} references non-existent category {txn['category_id']}")
    else:
        print("✅ All category references are valid")
    
    # Check recent transactions
    cursor.execute("""
        SELECT id, amount, description, date, type, category_id, is_recurring
        FROM transactions 
        WHERE user_id = 10 
        ORDER BY date DESC 
        LIMIT 3
    """)
    recent = cursor.fetchall()
    
    print(f"\n📋 Recent transactions:")
    for txn in recent:
        print(f"   ID {txn['id']}: {txn['amount']} {txn['type']} on {txn['date']}")
    
    cursor.close()

def check_categories(conn):
    """Check if categories table is OK."""
    cursor = conn.cursor()
    
    print(f"\n🏷️  Checking Categories")
    print("=" * 20)
    
    cursor.execute("SELECT COUNT(*) as count FROM categories")
    count = cursor.fetchone()['count']
    print(f"📊 Found {count} categories")
    
    cursor.close()

if __name__ == "__main__":
    print("🔍 User Data Checker")
    print("=" * 30)
    print("⚠️  Make sure to run: railway variables")
    print("   And copy the DATABASE_PUBLIC_URL")
    print()
    
    conn = connect_to_db()
    try:
        check_user_data(conn)
        check_categories(conn)
    finally:
        conn.close()
    
    print("\n💡 Next steps:")
    print("1. Check Railway logs for the exact error")
    print("2. If you found bad data, we can fix it")
    print("3. Clear Redis cache for user 10")
