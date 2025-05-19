"""
Test script to verify database connection with different SSL modes.
This script attempts to connect to the Railway PostgreSQL database
using various SSL modes to determine which one works.
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
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
    logger.error("Usage: python test_db_connection.py [public_url] [internal_url]")
    sys.exit(1)

# List of URLs to try
urls_to_try = []
if DATABASE_PUBLIC_URL:
    urls_to_try.append(("PUBLIC", DATABASE_PUBLIC_URL))
if DATABASE_INTERNAL_URL:
    urls_to_try.append(("INTERNAL", DATABASE_INTERNAL_URL))

# Normalize URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# List of SSL modes to try
ssl_modes = ["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]

# Test each SSL mode
success = False
for ssl_mode in ssl_modes:
    logger.info(f"Testing connection with sslmode={ssl_mode}")

    try:
        # Create engine with current SSL mode
        engine = create_engine(
            DATABASE_URL,
            connect_args={
                "sslmode": ssl_mode,
                "connect_timeout": 10,
            },
        )

        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            value = result.scalar()
            logger.info(
                f"✅ Connection SUCCESSFUL with sslmode={ssl_mode}! Result: {value}"
            )
            success = True

            # Try a more complex query to verify full functionality
            try:
                tables = conn.execute(
                    text(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
                    )
                )
                logger.info("Tables in database:")
                for table in tables:
                    logger.info(f"  - {table[0]}")
            except Exception as table_e:
                logger.warning(
                    f"Could list tables with sslmode={ssl_mode}: {str(table_e)}"
                )

    except Exception as e:
        logger.error(f"❌ Connection FAILED with sslmode={ssl_mode}: {str(e)}")

    # Add a small delay between attempts
    time.sleep(1)

if success:
    logger.info("At least one SSL mode worked successfully!")
    logger.info(
        "You should set DATABASE_SSL_MODE to one of the working modes in Railway:"
    )
    logger.info("  railway variables set DATABASE_SSL_MODE=<working_mode>")
else:
    logger.error("All SSL modes failed. There might be other connection issues.")
    logger.error("Check if the database is accessible and the URL is correct.")
