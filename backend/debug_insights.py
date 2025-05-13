"""
Script to debug the AI insights API endpoints.
This script will make requests to the AI insights endpoints and print the responses.
"""

import requests
import json
import sys
import os

# Get the backend URL from environment or use default
BACKEND_URL = os.environ.get("BACKEND_URL", "https://life-dashboard-production-27bf.up.railway.app")

def debug_insights():
    """Debug the AI insights API endpoints."""
    print(f"Debugging AI insights endpoints for {BACKEND_URL}...")
    
    # Set headers to simulate a request from the frontend
    headers = {
        "Origin": "https://life-dashboard-eta.vercel.app",
        "Content-Type": "application/json",
    }
    
    # Test the remaining uses endpoint
    remaining_url = f"{BACKEND_URL}/api/v1/insights/remaining"
    print(f"\nTesting endpoint: {remaining_url}")
    
    try:
        # Make a request to the endpoint
        response = requests.get(remaining_url, headers=headers)
        
        # Print response status code
        print(f"Status code: {response.status_code}")
        
        # Print response headers
        print("Response headers:")
        for key, value in response.headers.items():
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
    
    # Test the transactions endpoint
    transactions_url = f"{BACKEND_URL}/api/v1/insights/transactions"
    print(f"\nTesting endpoint: {transactions_url}")
    
    # Sample request body
    request_body = {
        "time_period": "month",
    }
    
    try:
        # Make a request to the endpoint
        response = requests.post(transactions_url, headers=headers, json=request_body)
        
        # Print response status code
        print(f"Status code: {response.status_code}")
        
        # Print response headers
        print("Response headers:")
        for key, value in response.headers.items():
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
    
    print("\nDebug completed!")

if __name__ == "__main__":
    debug_insights()
