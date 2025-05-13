"""
Simple script to test CORS configuration.
This script will make a request to the backend API from a different origin.
"""

import requests
import json
import sys
import os

# Get the backend URL from environment or use default
BACKEND_URL = os.environ.get("BACKEND_URL", "https://life-dashboard-production-27bf.up.railway.app")

def test_cors():
    """Test CORS configuration by making a request to the backend API."""
    print(f"Testing CORS configuration for {BACKEND_URL}...")
    
    # Set headers to simulate a request from a different origin
    headers = {
        "Origin": "https://life-dashboard-eta.vercel.app",
        "Referer": "https://life-dashboard-eta.vercel.app/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    }
    
    # Test endpoints
    endpoints = [
        "/cors-test",
        "/api/v1/insights/remaining",
        "/health",
    ]
    
    for endpoint in endpoints:
        url = f"{BACKEND_URL}{endpoint}"
        print(f"\nTesting endpoint: {url}")
        
        try:
            # Make a request to the endpoint
            response = requests.get(url, headers=headers)
            
            # Print response status code
            print(f"Status code: {response.status_code}")
            
            # Print response headers
            print("Response headers:")
            for key, value in response.headers.items():
                if key.lower().startswith("access-control"):
                    print(f"  {key}: {value}")
            
            # Print response body
            try:
                print("Response body:")
                print(json.dumps(response.json(), indent=2))
            except json.JSONDecodeError:
                print("Response body (not JSON):")
                print(response.text[:200] + "..." if len(response.text) > 200 else response.text)
                
        except Exception as e:
            print(f"Error: {e}")
    
    print("\nCORS test completed!")

if __name__ == "__main__":
    test_cors()
