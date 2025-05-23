#!/usr/bin/env python3
"""
Test a JWT token to see if it's valid and what user it belongs to.
"""

import requests
import json
import sys

BACKEND_URL = "https://life-dashboard-production-27bf.up.railway.app"

def test_token(token):
    """Test if a token is valid by calling the /auth/me endpoint."""
    print(f"🔍 Testing token: {token[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": "https://life-dashboard-eta.vercel.app",
        "Content-Type": "application/json"
    }
    
    # Test auth/me endpoint
    url = f"{BACKEND_URL}/api/v1/auth/me"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Token is valid!")
            print(f"User: {user_data.get('email', 'Unknown')}")
            print(f"User ID: {user_data.get('id', 'Unknown')}")
            return True
        else:
            print(f"❌ Token is invalid: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_transactions_with_token(token):
    """Test transactions endpoint with the token."""
    print(f"\n🔍 Testing transactions endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": "https://life-dashboard-eta.vercel.app",
        "Content-Type": "application/json"
    }
    
    url = f"{BACKEND_URL}/api/v1/transactions/"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Transactions endpoint works!")
            print(f"Found {len(data)} transactions")
            return True
        else:
            print(f"❌ Transactions failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_token.py <your_jwt_token>")
        print("\nTo get your token:")
        print("1. Login to the production site")
        print("2. Open browser dev tools (F12)")
        print("3. Go to Application/Storage → Cookies")
        print("4. Copy the 'token' value")
        sys.exit(1)
    
    token = sys.argv[1]
    
    print("🔍 JWT Token Tester")
    print("=" * 30)
    
    # Test the token
    if test_token(token):
        test_transactions_with_token(token)
    else:
        print("\n💡 Possible solutions:")
        print("1. Try logging out and logging back in")
        print("2. Clear browser cookies and login again")
        print("3. Check if your account is still active")
