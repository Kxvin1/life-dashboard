#!/usr/bin/env python3
"""
Debug script to check cache key mismatches between pre-warming and actual API calls
"""

import requests
import time
import json

BASE_URL = "https://life-dashboard-production-27bf.up.railway.app"

def get_demo_token():
    """Get demo user token"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/demo")
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_endpoint_with_timing(endpoint, token, description):
    """Test endpoint and check if it's using cache"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🔍 Testing {description}")
    print(f"📍 Endpoint: {endpoint}")
    
    # First call - should hit cache if pre-warmed
    start_time = time.time()
    response1 = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    time1 = time.time() - start_time
    
    # Second call - should definitely hit cache
    start_time = time.time()
    response2 = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    time2 = time.time() - start_time
    
    # Third call - should hit cache
    start_time = time.time()
    response3 = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    time3 = time.time() - start_time
    
    if response1.status_code == 200:
        print(f"✅ Status: {response1.status_code}")
        print(f"⏱️ Call 1: {time1*1000:.1f}ms")
        print(f"⏱️ Call 2: {time2*1000:.1f}ms") 
        print(f"⏱️ Call 3: {time3*1000:.1f}ms")
        
        # Check for cache headers
        headers_to_check = ['x-cache-hit', 'cache-control', 'etag', 'x-process-time']
        print("📋 Response headers:")
        for header in headers_to_check:
            value = response1.headers.get(header, 'Not present')
            print(f"   {header}: {value}")
        
        # Analyze timing pattern
        avg_time = (time1 + time2 + time3) / 3 * 1000
        if avg_time < 100:
            print("🎉 FAST: Likely hitting cache!")
        elif time2 < time1 * 0.5 or time3 < time1 * 0.5:
            print("🔄 MIXED: Some cache hits, some misses")
        else:
            print("🐌 SLOW: Likely NOT hitting cache")
            
        return True, avg_time
    else:
        print(f"❌ Failed: {response1.status_code}")
        return False, 0

def check_redis_keys():
    """Check what keys are actually in Redis"""
    print("\n🔍 Checking Redis cache keys...")
    
    response = requests.get(f"{BASE_URL}/api/v1/admin/demo-status")
    if response.status_code == 200:
        data = response.json()
        print(f"📊 Demo user ID: {data['demo_user_id']}")
        print(f"📊 Redis available: {data['redis_available']}")
        print("📋 Cached keys:")
        for key, cached in data['cached_endpoints'].items():
            status = "✅ CACHED" if cached else "❌ NOT CACHED"
            print(f"   {key}: {status}")
        return data['demo_user_id']
    return None

def trigger_prewarm_and_check():
    """Trigger pre-warming and check timing"""
    print("\n🔥 Triggering fresh pre-warming...")
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/v1/admin/prewarm-demo")
    prewarm_time = time.time() - start_time
    
    if response.status_code == 200:
        print(f"✅ Pre-warming completed in {prewarm_time*1000:.1f}ms")
        return True
    else:
        print(f"❌ Pre-warming failed: {response.status_code}")
        return False

def main():
    """Main diagnostic function"""
    print("🔍 Cache Key Mismatch Diagnostic Tool")
    print("=" * 50)
    
    # Check current Redis state
    demo_user_id = check_redis_keys()
    if not demo_user_id:
        print("❌ Could not get demo user info")
        return
    
    # Get demo token
    token = get_demo_token()
    if not token:
        print("❌ Could not get demo token")
        return
    
    print(f"\n✅ Demo user ID: {demo_user_id}")
    print(f"✅ Got demo token")
    
    # Trigger fresh pre-warming
    if not trigger_prewarm_and_check():
        return
    
    print("\n" + "="*50)
    print("🧪 TESTING ENDPOINTS AFTER FRESH PRE-WARMING")
    print("="*50)
    
    # Test endpoints that should be pre-warmed
    endpoints_to_test = [
        ("/api/v1/subscriptions/?status=active", "Active Subscriptions"),
        ("/api/v1/subscriptions/?status=inactive", "Inactive Subscriptions"),
        ("/api/v1/transactions/", "Recent Transactions"),
        ("/api/v1/tasks/?is_long_term=false", "Short-term Tasks"),
        ("/api/v1/pomodoro/sessions", "Pomodoro Sessions"),
    ]
    
    results = []
    for endpoint, description in endpoints_to_test:
        success, avg_time = test_endpoint_with_timing(endpoint, token, description)
        if success:
            results.append((description, avg_time))
    
    print("\n" + "="*50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("="*50)
    
    if results:
        total_avg = sum(time for _, time in results) / len(results)
        print(f"📊 Overall average response time: {total_avg:.1f}ms")
        
        fast_endpoints = [desc for desc, time in results if time < 100]
        slow_endpoints = [desc for desc, time in results if time >= 100]
        
        if fast_endpoints:
            print(f"🎉 Fast endpoints (likely cached): {len(fast_endpoints)}")
            for desc in fast_endpoints:
                print(f"   ✅ {desc}")
        
        if slow_endpoints:
            print(f"🐌 Slow endpoints (likely not cached): {len(slow_endpoints)}")
            for desc in slow_endpoints:
                print(f"   ❌ {desc}")
        
        if len(fast_endpoints) == len(results):
            print("\n🎉 SUCCESS: All endpoints are fast - pre-warming is working!")
        elif len(fast_endpoints) > 0:
            print("\n🔄 PARTIAL: Some endpoints are cached, others are not")
            print("💡 This suggests cache key mismatches for slow endpoints")
        else:
            print("\n❌ PROBLEM: No endpoints are fast - cache is not being used")
            print("💡 This suggests either cache key mismatches or cache not being checked")
    
    print("\n🔧 Next steps:")
    print("1. Check if cache keys match between pre-warming and API calls")
    print("2. Verify API endpoints are actually checking Redis cache")
    print("3. Look for any cache invalidation happening between pre-warm and API calls")

if __name__ == "__main__":
    main()
