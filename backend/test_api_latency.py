"""
Test script to measure API endpoint latency.
This script makes requests to various API endpoints and measures the response time.
"""

import os
import sys
import logging
import time
import requests
import statistics
import json
from concurrent.futures import ThreadPoolExecutor
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Default API URL
DEFAULT_API_URL = "https://life-dashboard-production-27bf.up.railway.app"

# Parse command line arguments
parser = argparse.ArgumentParser(description="Test API endpoint latency")
parser.add_argument("--url", default=DEFAULT_API_URL, help="Base API URL")
parser.add_argument("--token", help="Authentication token")
parser.add_argument("--iterations", type=int, default=5, help="Number of test iterations")
parser.add_argument("--concurrent", type=int, default=3, help="Number of concurrent requests")
args = parser.parse_args()

# API endpoints to test
ENDPOINTS = [
    {
        "name": "Health Check",
        "path": "/",
        "method": "GET",
        "auth_required": False,
    },
    {
        "name": "DB Health",
        "path": "/db-health",
        "method": "GET",
        "auth_required": False,
    },
    {
        "name": "Categories",
        "path": "/api/v1/categories/",
        "method": "GET",
        "auth_required": True,
    },
    {
        "name": "Transactions",
        "path": "/api/v1/transactions/",
        "method": "GET",
        "auth_required": True,
    },
    {
        "name": "Monthly Summary",
        "path": "/api/v1/summaries/monthly?year=2023",
        "method": "GET",
        "auth_required": True,
    },
    {
        "name": "Yearly Summary",
        "path": "/api/v1/summaries/yearly?year=2023",
        "method": "GET",
        "auth_required": True,
    },
    {
        "name": "Subscriptions",
        "path": "/api/v1/subscriptions/",
        "method": "GET",
        "auth_required": True,
    },
    {
        "name": "Tasks",
        "path": "/api/v1/tasks/",
        "method": "GET",
        "auth_required": True,
    },
]

def test_endpoint(endpoint, base_url, token=None, iteration=0):
    """Test a single API endpoint and measure latency."""
    url = f"{base_url}{endpoint['path']}"
    headers = {}
    
    if endpoint["auth_required"] and token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        start_time = time.time()
        response = requests.request(
            method=endpoint["method"],
            url=url,
            headers=headers,
            timeout=10,
        )
        elapsed = time.time() - start_time
        
        status_code = response.status_code
        content_length = len(response.content)
        
        return {
            "endpoint": endpoint["name"],
            "url": url,
            "status_code": status_code,
            "elapsed": elapsed,
            "content_length": content_length,
            "iteration": iteration,
        }
    except Exception as e:
        logger.error(f"Error testing endpoint {url}: {str(e)}")
        return {
            "endpoint": endpoint["name"],
            "url": url,
            "status_code": 0,
            "elapsed": 0,
            "content_length": 0,
            "error": str(e),
            "iteration": iteration,
        }

def run_tests(base_url, token=None, iterations=5, concurrent=3):
    """Run tests for all endpoints with multiple iterations."""
    all_results = []
    
    # First, test endpoints that don't require authentication
    for endpoint in [e for e in ENDPOINTS if not e["auth_required"]]:
        logger.info(f"Testing endpoint: {endpoint['name']} ({endpoint['path']})")
        
        endpoint_results = []
        for i in range(iterations):
            result = test_endpoint(endpoint, base_url, token, i)
            if result["status_code"] > 0:
                endpoint_results.append(result)
                logger.info(f"  Iteration {i+1}/{iterations}: {result['elapsed']:.4f}s")
            else:
                logger.error(f"  Iteration {i+1}/{iterations}: Failed - {result.get('error', 'Unknown error')}")
        
        if endpoint_results:
            elapsed_times = [r["elapsed"] for r in endpoint_results]
            avg_time = statistics.mean(elapsed_times)
            min_time = min(elapsed_times)
            max_time = max(elapsed_times)
            
            logger.info(f"  Results: Avg={avg_time:.4f}s, Min={min_time:.4f}s, Max={max_time:.4f}s")
            all_results.extend(endpoint_results)
    
    # Skip authenticated endpoints if no token provided
    if not token:
        logger.warning("No authentication token provided. Skipping authenticated endpoints.")
        return all_results
    
    # Test endpoints that require authentication
    for endpoint in [e for e in ENDPOINTS if e["auth_required"]]:
        logger.info(f"Testing endpoint: {endpoint['name']} ({endpoint['path']})")
        
        # Use ThreadPoolExecutor for concurrent requests
        with ThreadPoolExecutor(max_workers=concurrent) as executor:
            futures = []
            for i in range(iterations):
                futures.append(executor.submit(test_endpoint, endpoint, base_url, token, i))
            
            # Collect results
            endpoint_results = []
            for i, future in enumerate(futures):
                try:
                    result = future.result()
                    if result["status_code"] > 0:
                        endpoint_results.append(result)
                        logger.info(f"  Iteration {i+1}/{iterations}: {result['elapsed']:.4f}s")
                    else:
                        logger.error(f"  Iteration {i+1}/{iterations}: Failed - {result.get('error', 'Unknown error')}")
                except Exception as e:
                    logger.error(f"  Iteration {i+1}/{iterations}: Error - {str(e)}")
        
        if endpoint_results:
            elapsed_times = [r["elapsed"] for r in endpoint_results]
            avg_time = statistics.mean(elapsed_times)
            min_time = min(elapsed_times)
            max_time = max(elapsed_times)
            
            logger.info(f"  Results: Avg={avg_time:.4f}s, Min={min_time:.4f}s, Max={max_time:.4f}s")
            all_results.extend(endpoint_results)
    
    return all_results

def main():
    """Main function to run the tests."""
    logger.info(f"Testing API endpoints at {args.url}")
    logger.info(f"Iterations: {args.iterations}, Concurrent requests: {args.concurrent}")
    
    if args.token:
        logger.info("Authentication token provided")
    else:
        logger.info("No authentication token provided. Will only test public endpoints.")
    
    results = run_tests(args.url, args.token, args.iterations, args.concurrent)
    
    # Calculate overall statistics
    if results:
        # Group results by endpoint
        endpoint_results = {}
        for result in results:
            endpoint = result["endpoint"]
            if endpoint not in endpoint_results:
                endpoint_results[endpoint] = []
            endpoint_results[endpoint].append(result)
        
        # Print summary
        logger.info("\nSummary:")
        for endpoint, results in endpoint_results.items():
            elapsed_times = [r["elapsed"] for r in results]
            avg_time = statistics.mean(elapsed_times)
            min_time = min(elapsed_times)
            max_time = max(elapsed_times)
            median_time = statistics.median(elapsed_times)
            
            logger.info(f"Endpoint: {endpoint}")
            logger.info(f"  Avg: {avg_time:.4f}s, Median: {median_time:.4f}s, Min: {min_time:.4f}s, Max: {max_time:.4f}s")
    else:
        logger.error("No results collected. All tests failed.")

if __name__ == "__main__":
    main()
