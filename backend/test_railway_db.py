"""
Test script to verify database connection with different URLs and SSL modes.
This script attempts to connect to the Railway PostgreSQL database
using both internal and public URLs with various SSL modes.
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Get database URLs
DATABASE_PUBLIC_URL = os.environ.get("DATABASE_PUBLIC_URL", "")
DATABASE_INTERNAL_URL = os.environ.get("DATABASE_URL", "")

# Override with command line arguments if provided
if len(sys.argv) > 1:
    DATABASE_PUBLIC_URL = sys.argv[1]
    
if len(sys.argv) > 2:
    DATABASE_INTERNAL_URL = sys.argv[2]

# Check if we have at least one URL
if not DATABASE_PUBLIC_URL and not DATABASE_INTERNAL_URL:
    logger.error("No database URLs available. Please provide at least one URL.")
    logger.error("Usage: python test_railway_db.py [public_url] [internal_url]")
    sys.exit(1)
    
# List of URLs to try
urls_to_try = []
if DATABASE_PUBLIC_URL:
    urls_to_try.append(("PUBLIC", DATABASE_PUBLIC_URL))
if DATABASE_INTERNAL_URL:
    urls_to_try.append(("INTERNAL", DATABASE_INTERNAL_URL))

# List of SSL modes to try
ssl_modes = ["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]

# Track overall success
overall_success = False

# Try each URL with each SSL mode
for url_type, url in urls_to_try:
    logger.info(f"\n===== Testing {url_type} URL =====")
    logger.info(f"URL: {url.split('@')[1] if '@' in url else 'masked'}")
    
    # Normalize URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    # Test each SSL mode with this URL
    url_success = False
    
    for ssl_mode in ssl_modes:
        logger.info(f"Testing {url_type} connection with sslmode={ssl_mode}")
        
        try:
            # Create engine with current SSL mode
            engine = create_engine(
                url,
                connect_args={
                    "sslmode": ssl_mode,
                    "connect_timeout": 10,
                },
            )
            
            # Test connection
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                value = result.scalar()
                logger.info(f"✅ Connection SUCCESSFUL with {url_type} URL and sslmode={ssl_mode}! Result: {value}")
                url_success = True
                overall_success = True
                
                # Try a more complex query to verify full functionality
                try:
                    tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 5"))
                    logger.info("Sample tables in database:")
                    for table in tables:
                        logger.info(f"  - {table[0]}")
                except Exception as table_e:
                    logger.warning(f"Could not list tables with sslmode={ssl_mode}: {str(table_e)}")
                
                # Record the working configuration
                logger.info(f"\n✅ WORKING CONFIGURATION FOUND:")
                logger.info(f"URL Type: {url_type}")
                logger.info(f"SSL Mode: {ssl_mode}")
                logger.info(f"Railway CLI Command: railway variables --set \"DATABASE_SSL_MODE={ssl_mode}\"")
                
                # No need to try other SSL modes for this URL
                break
                    
        except Exception as e:
            logger.error(f"❌ Connection FAILED with {url_type} URL and sslmode={ssl_mode}: {str(e)}")
        
        # Add a small delay between attempts
        time.sleep(1)
    
    if not url_success:
        logger.warning(f"All SSL modes failed for {url_type} URL")

if overall_success:
    logger.info("\n✅ At least one configuration worked successfully!")
    logger.info("Set the DATABASE_SSL_MODE variable in Railway using the command shown above.")
else:
    logger.error("\n❌ All configurations failed. There might be other connection issues.")
    logger.error("Possible solutions:")
    logger.error("1. Check if the database is accessible and the URLs are correct")
    logger.error("2. Verify that the PostgreSQL service is running in Railway")
    logger.error("3. Check if there are any network restrictions")
    logger.error("4. Try recreating the PostgreSQL service in Railway")
