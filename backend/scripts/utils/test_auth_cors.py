"""
Script to test CORS configuration for auth endpoints.
This script will make POST requests to the auth endpoints from a different origin.
"""

import requests
import json
import sys
import os

# Get the backend URL from environment or use default
BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")


def test_auth_cors():
    """Test CORS configuration for auth endpoints."""
    print(f"Testing auth CORS configuration for {BACKEND_URL}...")

    # Set headers to simulate a request from a different origin
    headers = {
        "Origin": "https://life-dashboard-eta.vercel.app",
        "Referer": "https://life-dashboard-eta.vercel.app/",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    }

    # Test endpoints with POST requests
    endpoints = [
        {"path": "/api/v1/auth/demo", "method": "POST", "data": {}},
        {
            "path": "/api/v1/auth/login",
            "method": "POST",
            "data": {"email": "test@example.com", "password": "password123"},
        },
        {
            "path": "/api/v1/auth/register",
            "method": "POST",
            "data": {
                "email": "newuser@example.com",
                "password": "password123",
                "full_name": "Test User",
            },
        },
    ]

    # First test OPTIONS requests (preflight)
    print("\n=== Testing OPTIONS (preflight) requests ===")
    for endpoint in endpoints:
        url = f"{BACKEND_URL}{endpoint['path']}"
        print(f"\nTesting OPTIONS for endpoint: {url}")

        try:
            # Make an OPTIONS request to the endpoint
            response = requests.options(url, headers=headers)

            # Print response status code
            print(f"Status code: {response.status_code}")

            # Print response headers
            print("Response headers:")
            for key, value in response.headers.items():
                if key.lower().startswith("access-control"):
                    print(f"  {key}: {value}")

        except Exception as e:
            print(f"Error: {e}")

    # Then test actual POST requests
    print("\n=== Testing POST requests ===")
    for endpoint in endpoints:
        url = f"{BACKEND_URL}{endpoint['path']}"
        print(f"\nTesting endpoint: {url}")

        try:
            # Make a request to the endpoint
            response = requests.post(url, headers=headers, json=endpoint["data"])

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
                print(
                    response.text[:200] + "..."
                    if len(response.text) > 200
                    else response.text
                )

        except Exception as e:
            print(f"Error: {e}")

    print("\nAuth CORS test completed!")


if __name__ == "__main__":
    test_auth_cors()
