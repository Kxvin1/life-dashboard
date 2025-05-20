"""
Test script to measure database connection performance with different settings.
This script attempts to connect to the database and measure the time it takes
to establish a connection and execute a simple query.
"""

import os
import sys
import logging
import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from concurrent.futures import ThreadPoolExecutor
import statistics

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Get database URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Override with command line arguments if provided
if len(sys.argv) > 1:
    DATABASE_URL = sys.argv[1]

# Check if we have a URL
if not DATABASE_URL:
    logger.error("No database URL available. Please provide a URL.")
    logger.error("Usage: python test_connection_performance.py [database_url]")
    sys.exit(1)

# Normalize URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Mask the URL for logging
masked_url = DATABASE_URL.split("@")[1] if "@" in DATABASE_URL else "masked"
logger.info(f"Testing connection performance for {masked_url}")

# Test different SSL modes
ssl_modes = ["prefer", "require", "disable"]

# Test different pool sizes
pool_sizes = [5, 10, 20, 30]

# Number of concurrent connections to test
concurrent_connections = 10

# Number of test iterations
iterations = 3


def test_connection(engine, iteration):
    """Test a single database connection and measure performance."""
    start_time = time.time()
    
    try:
        # Create a session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Execute a simple query
        result = session.execute(text("SELECT 1"))
        value = result.scalar()
        
        # Close the session
        session.close()
        
        # Calculate time taken
        elapsed = time.time() - start_time
        return elapsed
    except Exception as e:
        logger.error(f"Connection failed: {str(e)}")
        return None


def test_concurrent_connections(engine, num_connections):
    """Test multiple concurrent connections."""
    with ThreadPoolExecutor(max_workers=num_connections) as executor:
        # Submit connection tests
        futures = [executor.submit(test_connection, engine, i) for i in range(num_connections)]
        
        # Collect results
        results = []
        for future in futures:
            try:
                result = future.result()
                if result is not None:
                    results.append(result)
            except Exception as e:
                logger.error(f"Thread error: {str(e)}")
        
        return results


# Test each combination of settings
for ssl_mode in ssl_modes:
    for pool_size in pool_sizes:
        logger.info(f"\nTesting with sslmode={ssl_mode}, pool_size={pool_size}")
        
        # Create engine with current settings
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=pool_size,
            max_overflow=pool_size,
            connect_args={
                "sslmode": ssl_mode,
                "connect_timeout": 15,
                "keepalives": 1,
                "keepalives_idle": 60,
                "keepalives_interval": 10,
                "keepalives_count": 3,
            } if ssl_mode != "disable" else {},
        )
        
        # Run multiple iterations
        all_times = []
        for i in range(iterations):
            logger.info(f"  Iteration {i+1}/{iterations}")
            
            # Test concurrent connections
            times = test_concurrent_connections(engine, concurrent_connections)
            if times:
                all_times.extend(times)
                
                # Log statistics for this iteration
                avg_time = sum(times) / len(times)
                min_time = min(times)
                max_time = max(times)
                logger.info(f"    Connections: {len(times)}/{concurrent_connections}")
                logger.info(f"    Avg time: {avg_time:.4f}s, Min: {min_time:.4f}s, Max: {max_time:.4f}s")
        
        # Calculate overall statistics
        if all_times:
            avg_time = sum(all_times) / len(all_times)
            min_time = min(all_times)
            max_time = max(all_times)
            median_time = statistics.median(all_times)
            stdev_time = statistics.stdev(all_times) if len(all_times) > 1 else 0
            
            logger.info(f"\nResults for sslmode={ssl_mode}, pool_size={pool_size}:")
            logger.info(f"  Total connections: {len(all_times)}")
            logger.info(f"  Average time: {avg_time:.4f}s")
            logger.info(f"  Median time: {median_time:.4f}s")
            logger.info(f"  Min time: {min_time:.4f}s")
            logger.info(f"  Max time: {max_time:.4f}s")
            logger.info(f"  Standard deviation: {stdev_time:.4f}s")
        else:
            logger.error(f"All connections failed for sslmode={ssl_mode}, pool_size={pool_size}")

logger.info("\nPerformance testing completed.")
