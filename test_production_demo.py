#!/usr/bin/env python3
"""
Test script to verify demo user performance in production
"""

import requests
import time
import json

BASE_URL = "https://life-dashboard-production-27bf.up.railway.app"

def test_demo_login():
    """Test demo user login and get access token"""
    print("🔐 Testing production demo user login...")
    
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/v1/auth/demo")
    login_time = time.time() - start_time
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ Demo login successful in {login_time*1000:.1f}ms")
        return token
    else:
        print(f"❌ Demo login failed: {response.status_code} - {response.text}")
        return None

def test_api_endpoint(endpoint, token, description):
    """Test an API endpoint and measure response time"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"📊 Testing {description}...")
    start_time = time.time()
    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    response_time = time.time() - start_time
    
    if response.status_code == 200:
        data = response.json()
        data_size = len(json.dumps(data)) if isinstance(data, (dict, list)) else len(str(data))
        print(f"✅ {description}: {response_time*1000:.1f}ms ({data_size} bytes)")
        return True, response_time
    else:
        print(f"❌ {description} failed: {response.status_code}")
        return False, response_time

def main():
    """Main test function"""
    print("🚀 Testing Production Demo User Performance")
    print("=" * 50)
    
    # Test demo login
    token = test_demo_login()
    if not token:
        print("❌ Cannot continue without valid token")
        return
    
    print()
    print("📊 Testing API endpoints (should be fast due to pre-warming):")
    print("-" * 50)
    
    # Test key endpoints that should be pre-warmed
    endpoints_to_test = [
        ("/api/v1/auth/me", "User Info"),
        ("/api/v1/subscriptions/?status=active", "Active Subscriptions"),
        ("/api/v1/subscriptions/?status=inactive", "Inactive Subscriptions"),
        ("/api/v1/subscriptions-summary/", "Subscription Summary"),
        ("/api/v1/transactions/", "Recent Transactions"),
        ("/api/v1/summaries/monthly?year=2025", "Monthly Summary"),
        ("/api/v1/summaries/yearly?year=2025", "Yearly Summary"),
        ("/api/v1/tasks/?is_long_term=false", "Short-term Tasks"),
        ("/api/v1/tasks/?is_long_term=true", "Long-term Tasks"),
        ("/api/v1/pomodoro/sessions", "Pomodoro Sessions"),
        ("/api/v1/pomodoro/counts", "Pomodoro Counts"),
    ]
    
    total_time = 0
    successful_tests = 0
    response_times = []
    
    for endpoint, description in endpoints_to_test:
        success, response_time = test_api_endpoint(endpoint, token, description)
        total_time += response_time
        response_times.append(response_time)
        if success:
            successful_tests += 1
    
    print()
    print("📈 Production Test Results Summary:")
    print("=" * 50)
    print(f"✅ Successful tests: {successful_tests}/{len(endpoints_to_test)}")
    print(f"⏱️ Total API time: {total_time*1000:.1f}ms")
    print(f"📊 Average per endpoint: {(total_time/len(endpoints_to_test))*1000:.1f}ms")
    print(f"🚀 Fastest response: {min(response_times)*1000:.1f}ms")
    print(f"🐌 Slowest response: {max(response_times)*1000:.1f}ms")
    
    # Performance evaluation
    avg_time_ms = (total_time/len(endpoints_to_test))*1000
    if successful_tests == len(endpoints_to_test):
        if avg_time_ms < 100:
            print("🎉 EXCELLENT: All endpoints are lightning fast!")
            print("🔥 Pre-warming is working perfectly in production!")
        elif avg_time_ms < 500:
            print("✅ GOOD: All endpoints are reasonably fast")
            print("🔥 Pre-warming is working well")
        else:
            print("⚠️ SLOW: Endpoints are working but slower than expected")
            print("🔍 Pre-warming may need investigation")
    else:
        print("⚠️ Some endpoints failed - check the results above")

if __name__ == "__main__":
    main()
