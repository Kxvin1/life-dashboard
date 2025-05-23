#!/usr/bin/env python3
"""
Safe script to clear only corrupted Redis cache entries without affecting user data.
This script ONLY clears Redis cache - it does NOT touch the PostgreSQL database.

Redis cache contains only temporary performance data that gets regenerated automatically.
"""

import os
import sys
import redis
import json
from typing import List, Dict, Any

def connect_to_redis() -> redis.Redis:
    """Connect to Redis using environment variables."""
    redis_url = os.environ.get("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL environment variable not found")
        sys.exit(1)
    
    try:
        client = redis.from_url(redis_url, decode_responses=True)
        # Test connection
        client.ping()
        print(f"✅ Connected to Redis successfully")
        return client
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")
        sys.exit(1)

def scan_cache_keys(client: redis.Redis) -> List[str]:
    """Scan for all cache keys without loading them into memory."""
    print("🔍 Scanning for cache keys...")
    
    cache_keys = []
    cursor = 0
    
    while True:
        cursor, keys = client.scan(cursor, match="user_*", count=100)
        cache_keys.extend(keys)
        
        if cursor == 0:
            break
    
    print(f"📊 Found {len(cache_keys)} cache keys")
    return cache_keys

def clear_transaction_cache_only(client: redis.Redis) -> int:
    """Clear only transaction-related cache entries."""
    print("🎯 Clearing ONLY transaction cache entries...")
    
    cleared_count = 0
    cursor = 0
    
    # Patterns for transaction-related cache
    transaction_patterns = [
        "user_*_transactions_*",
        "user_*_transaction_*", 
        "user_*_summaries_*",
        "user_*_summary_*"
    ]
    
    for pattern in transaction_patterns:
        cursor = 0
        while True:
            cursor, keys = client.scan(cursor, match=pattern, count=100)
            
            if keys:
                # Delete in batches
                deleted = client.delete(*keys)
                cleared_count += deleted
                print(f"🧹 Cleared {deleted} keys matching pattern: {pattern}")
            
            if cursor == 0:
                break
    
    return cleared_count

def clear_all_cache_safe(client: redis.Redis) -> int:
    """Clear ALL cache entries (safe - only affects performance cache)."""
    print("🧹 Clearing ALL cache entries (this is SAFE - only performance cache)...")
    
    cleared_count = 0
    cursor = 0
    
    while True:
        cursor, keys = client.scan(cursor, match="user_*", count=100)
        
        if keys:
            # Delete in batches
            deleted = client.delete(*keys)
            cleared_count += deleted
            print(f"🧹 Cleared {deleted} cache keys")
        
        if cursor == 0:
            break
    
    return cleared_count

def main():
    print("🚀 Redis Cache Cleaner - Production Safe")
    print("=" * 50)
    print("⚠️  This script ONLY clears Redis cache (temporary performance data)")
    print("✅ Your PostgreSQL database and user data will NOT be affected")
    print("=" * 50)
    
    # Connect to Redis
    client = connect_to_redis()
    
    # Show current cache status
    cache_keys = scan_cache_keys(client)
    
    if not cache_keys:
        print("✅ No cache keys found - cache is already clean!")
        return
    
    print("\nChoose an option:")
    print("1. Clear ONLY transaction cache (recommended)")
    print("2. Clear ALL cache (safe - only performance data)")
    print("3. Just show cache info and exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        print("\n🎯 Clearing transaction cache only...")
        cleared = clear_transaction_cache_only(client)
        print(f"✅ Cleared {cleared} transaction cache entries")
        
    elif choice == "2":
        print("\n⚠️  Are you sure you want to clear ALL cache?")
        print("This is safe but will temporarily slow down the app until cache rebuilds.")
        confirm = input("Type 'YES' to confirm: ").strip()
        
        if confirm == "YES":
            cleared = clear_all_cache_safe(client)
            print(f"✅ Cleared {cleared} cache entries")
        else:
            print("❌ Operation cancelled")
            
    elif choice == "3":
        print(f"📊 Cache contains {len(cache_keys)} keys")
        print("👋 Exiting without changes")
        
    else:
        print("❌ Invalid choice")
        sys.exit(1)
    
    print("\n🎉 Cache clearing completed!")
    print("💡 The app will automatically rebuild cache as users access features")

if __name__ == "__main__":
    main()
