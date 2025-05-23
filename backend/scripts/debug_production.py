#!/usr/bin/env python3
"""
Debug script to check production backend status and identify the real issue.
"""

import requests
import json
import sys

BACKEND_URL = "https://life-dashboard-production-27bf.up.railway.app"

def test_basic_endpoints():
    """Test basic endpoints to see what's working."""
    print("🔍 Testing Production Backend Endpoints")
    print("=" * 50)
    
    endpoints = [
        "/health",
        "/",
        "/api/v1/categories",
        "/api/v1/transactions/",
    ]
    
    headers = {
        "Origin": "https://life-dashboard-eta.vercel.app",
        "User-Agent": "Mozilla/5.0 (compatible; Debug/1.0)",
    }
    
    for endpoint in endpoints:
        url = f"{BACKEND_URL}{endpoint}"
        print(f"\n🌐 Testing: {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.status_code == 500:
                print(f"   ❌ 500 Error - Body: {response.text[:200]}")
            elif response.status_code == 200:
                print(f"   ✅ Success")
            else:
                print(f"   ⚠️  Unexpected status: {response.text[:100]}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")

def test_with_auth():
    """Test with authentication to see if that's the issue."""
    print("\n🔐 Testing with Authentication")
    print("=" * 30)
    
    # You'll need to provide a valid token for this test
    print("⚠️  To test with auth, you need a valid JWT token")
    print("   You can get one by logging into the frontend and checking browser dev tools")

if __name__ == "__main__":
    test_basic_endpoints()
    test_with_auth()
