#!/usr/bin/env python3
"""
Simple test to see debug output from the API endpoints
"""

import requests
import time

BASE_URL = "https://life-dashboard-production-27bf.up.railway.app"

def test_with_debug():
    """Test endpoint and show debug output"""
    print("🔍 Testing with debug output enabled")
    print("=" * 50)
    
    # Get demo token
    print("🔐 Getting demo token...")
    response = requests.post(f"{BASE_URL}/api/v1/auth/demo")
    if response.status_code != 200:
        print(f"❌ Failed to get demo token: {response.status_code}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Got demo token")
    
    # Trigger pre-warming first
    print("\n🔥 Triggering pre-warming...")
    prewarm_response = requests.post(f"{BASE_URL}/api/v1/admin/prewarm-demo")
    if prewarm_response.status_code == 200:
        print("✅ Pre-warming completed")
    else:
        print(f"❌ Pre-warming failed: {prewarm_response.status_code}")
    
    # Wait a moment
    time.sleep(2)
    
    # Test the subscription endpoint
    print("\n📊 Testing subscription endpoint...")
    print("📍 Endpoint: /api/v1/subscriptions/?status=active")
    
    start_time = time.time()
    response = requests.get(f"{BASE_URL}/api/v1/subscriptions/?status=active", headers=headers)
    response_time = time.time() - start_time
    
    print(f"⏱️ Response time: {response_time*1000:.1f}ms")
    print(f"📊 Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"📊 Data length: {len(data)} items")
        
        # Check headers
        process_time = response.headers.get('x-process-time', 'Not present')
        print(f"📊 Process time header: {process_time}")
        
        print("\n🔄 Making second call to test cache...")
        start_time = time.time()
        response2 = requests.get(f"{BASE_URL}/api/v1/subscriptions/?status=active", headers=headers)
        response_time2 = time.time() - start_time
        
        print(f"⏱️ Second call time: {response_time2*1000:.1f}ms")
        process_time2 = response2.headers.get('x-process-time', 'Not present')
        print(f"📊 Second call process time: {process_time2}")
        
        # Analysis
        if response_time2 < response_time * 0.5:
            print("🎉 Second call was faster - likely cache hit!")
        else:
            print("🔴 Second call same speed - no cache hit detected")
    
    print("\n💡 Check the Railway logs to see the debug output from the API!")
    print("💡 Look for lines with 🔍, 🟢, 🔴 emojis to see cache behavior")

if __name__ == "__main__":
    test_with_debug()
