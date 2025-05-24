#!/usr/bin/env python3
"""
Detailed cache key debugging - check what keys are actually created vs expected
"""

import requests
import time

BASE_URL = "https://life-dashboard-production-27bf.up.railway.app"

def get_demo_token():
    """Get demo user token"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/demo")
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def check_redis_keys_before_after():
    """Check Redis keys before and after pre-warming"""
    print("🔍 Checking Redis keys BEFORE pre-warming...")
    
    # Get initial state
    response = requests.get(f"{BASE_URL}/api/v1/admin/demo-status")
    if response.status_code == 200:
        before_data = response.json()
        print(f"📊 Demo user ID: {before_data['demo_user_id']}")
        print("📋 Keys BEFORE pre-warming:")
        for key, cached in before_data['cached_endpoints'].items():
            status = "✅ CACHED" if cached else "❌ NOT CACHED"
            print(f"   {key}: {status}")
    
    print("\n🔥 Triggering pre-warming...")
    start_time = time.time()
    prewarm_response = requests.post(f"{BASE_URL}/api/v1/admin/prewarm-demo")
    prewarm_time = time.time() - start_time
    
    if prewarm_response.status_code == 200:
        print(f"✅ Pre-warming completed in {prewarm_time*1000:.1f}ms")
    else:
        print(f"❌ Pre-warming failed: {prewarm_response.status_code}")
        return
    
    print("\n🔍 Checking Redis keys AFTER pre-warming...")
    
    # Get state after pre-warming
    response = requests.get(f"{BASE_URL}/api/v1/admin/demo-status")
    if response.status_code == 200:
        after_data = response.json()
        print("📋 Keys AFTER pre-warming:")
        for key, cached in after_data['cached_endpoints'].items():
            status = "✅ CACHED" if cached else "❌ NOT CACHED"
            print(f"   {key}: {status}")
        
        # Compare before and after
        print("\n📊 COMPARISON:")
        for key in before_data['cached_endpoints']:
            before_status = before_data['cached_endpoints'][key]
            after_status = after_data['cached_endpoints'][key]
            
            if before_status != after_status:
                print(f"🔄 {key}: {before_status} → {after_status}")
            else:
                print(f"🔴 {key}: No change (still {after_status})")

def test_single_endpoint_with_debug():
    """Test a single endpoint and see what cache key it actually uses"""
    print("\n🧪 Testing single endpoint with debug info...")
    
    token = get_demo_token()
    if not token:
        print("❌ Could not get demo token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📍 Testing: /api/v1/subscriptions/?status=active")
    
    # Make the API call and check what gets printed in logs
    start_time = time.time()
    response = requests.get(f"{BASE_URL}/api/v1/subscriptions/?status=active", headers=headers)
    response_time = time.time() - start_time
    
    print(f"⏱️ Response time: {response_time*1000:.1f}ms")
    print(f"📊 Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"📊 Data length: {len(data)} items")
        
        # Check process time header
        process_time = response.headers.get('x-process-time', 'Not present')
        print(f"📊 Process time: {process_time}")
        
        # Make the same call again to see if it hits cache
        print("\n🔄 Making same call again...")
        start_time = time.time()
        response2 = requests.get(f"{BASE_URL}/api/v1/subscriptions/?status=active", headers=headers)
        response_time2 = time.time() - start_time
        
        print(f"⏱️ Second call time: {response_time2*1000:.1f}ms")
        process_time2 = response2.headers.get('x-process-time', 'Not present')
        print(f"📊 Second call process time: {process_time2}")
        
        # Analyze if cache was hit
        if response_time2 < response_time * 0.5:
            print("🎉 Likely cache hit on second call!")
        else:
            print("🔴 No cache hit detected")

def main():
    """Main diagnostic function"""
    print("🔍 Detailed Cache Key Debugging")
    print("=" * 50)
    
    # Check keys before and after pre-warming
    check_redis_keys_before_after()
    
    # Test a single endpoint in detail
    test_single_endpoint_with_debug()
    
    print("\n" + "="*50)
    print("🔧 ANALYSIS")
    print("="*50)
    print("If keys are still NOT CACHED after pre-warming:")
    print("1. Pre-warming is calling the functions but cache isn't being set")
    print("2. Cache keys might be different than expected")
    print("3. Redis might not be working properly")
    print("4. Cache might be getting invalidated immediately")
    
    print("\nIf second API call is faster than first:")
    print("✅ Cache is working for regular API calls")
    print("❌ Pre-warming just isn't populating the cache")
    
    print("\nIf second API call is same speed as first:")
    print("❌ Cache is not working at all")
    print("🔧 Need to check Redis connection and cache logic")

if __name__ == "__main__":
    main()
