#!/usr/bin/env python3
"""
Test script to verify demo user pre-warming is working correctly.
This script tests the demo login and measures API response times.
"""

import requests
import time
import json

BASE_URL = "http://127.0.0.1:8000"


def test_demo_login():
    """Test demo user login and get access token"""
    print("🔐 Testing demo user login...")

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
        data_size = (
            len(json.dumps(data)) if isinstance(data, (dict, list)) else len(str(data))
        )
        print(f"✅ {description}: {response_time*1000:.1f}ms ({data_size} bytes)")
        return True
    else:
        print(f"❌ {description} failed: {response.status_code}")
        return False


def test_prewarming_status():
    """Test the pre-warming status endpoint"""
    print("🔥 Testing pre-warming status...")
    response = requests.get(f"{BASE_URL}/api/v1/admin/demo-status")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Demo user exists: {data['demo_user_exists']}")
        print(f"✅ Redis available: {data['redis_available']}")
        print("📊 Cached endpoints:")
        for endpoint, cached in data["cached_endpoints"].items():
            status = "✅ CACHED" if cached else "❌ NOT CACHED"
            print(f"   {endpoint}: {status}")
        return True
    else:
        print(f"❌ Status check failed: {response.status_code}")
        return False


def trigger_prewarming():
    """Trigger manual pre-warming"""
    print("🔥 Triggering manual pre-warming...")
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/api/v1/admin/prewarm-demo")
    prewarm_time = time.time() - start_time

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Pre-warming completed in {prewarm_time*1000:.1f}ms")

        # Handle both old and new response formats
        if "details" in data:
            print(
                f"📊 Pre-warmed endpoints: {len(data['details']['prewarmed_endpoints'])}"
            )
            if data["details"]["errors"]:
                print(f"⚠️ Errors: {len(data['details']['errors'])}")
                for error in data["details"]["errors"]:
                    print(f"   - {error}")
        elif "scheduler_status" in data:
            print(f"📊 Scheduler-based pre-warming completed")

        return True
    else:
        print(f"❌ Pre-warming failed: {response.status_code}")
        return False


def main():
    """Main test function"""
    print("🚀 Starting Demo User Pre-warming Test")
    print("=" * 50)

    # Test pre-warming status
    test_prewarming_status()
    print()

    # Trigger pre-warming to ensure everything is cached
    trigger_prewarming()
    print()

    # Test demo login
    token = test_demo_login()
    if not token:
        print("❌ Cannot continue without valid token")
        return

    print()
    print("📊 Testing API endpoints (should be instant due to pre-warming):")
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

    for endpoint, description in endpoints_to_test:
        start_time = time.time()
        success = test_api_endpoint(endpoint, token, description)
        test_time = time.time() - start_time
        total_time += test_time
        if success:
            successful_tests += 1

    print()
    print("📈 Test Results Summary:")
    print("=" * 50)
    print(f"✅ Successful tests: {successful_tests}/{len(endpoints_to_test)}")
    print(f"⏱️ Total API time: {total_time*1000:.1f}ms")
    print(f"📊 Average per endpoint: {(total_time/len(endpoints_to_test))*1000:.1f}ms")

    if successful_tests == len(endpoints_to_test) and total_time < 1.0:
        print("🎉 SUCCESS: All endpoints are fast and working!")
        print("🔥 Pre-warming is working correctly!")
    else:
        print("⚠️ Some issues detected - check the results above")


if __name__ == "__main__":
    main()
