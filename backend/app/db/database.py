from sqlalchemy import event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.core.config import settings
from app.db.engine import make_engine
import os
import time
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL with the correct precedence
# First check if we should use PG_ environment variables directly
use_pg_vars = os.environ.get("USE_PG_VARS", "").lower() == "true"

if use_pg_vars and all(
    os.environ.get(var) for var in ["PGHOST", "PGUSER", "PGPASSWORD", "PGDATABASE"]
):
    # Construct URL from PG_ variables
    pg_host = os.environ.get("PGHOST")
    pg_port = os.environ.get("PGPORT", "5432")
    pg_user = os.environ.get("PGUSER")
    pg_password = os.environ.get("PGPASSWORD")
    pg_database = os.environ.get("PGDATABASE")

    # Build the connection string
    database_url = (
        f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
    )
    logger.info(
        f"Using connection string built from PG_ environment variables: {pg_host}:{pg_port}/{pg_database}"
    )
# Next check if we have a direct connection string
elif direct_url := os.environ.get("DIRECT_DATABASE_URL"):
    database_url = direct_url
    logger.info("Using direct database connection string")
else:
    # default – rely on the DATABASE_URL that Railway injects
    database_url = os.environ["DATABASE_URL"]
    logger.info("Using DATABASE_URL from environment")
# else:
#     # Check if we should prioritize internal URL
#     use_internal = os.environ.get("USE_INTERNAL_DATABASE_URL", "").lower() == "true"

#     if use_internal:
#         # 1. Use DATABASE_URL (internal Railway network) if available
#         # 2. Fall back to DATABASE_PUBLIC_URL
#         database_url = (
#             os.environ.get("DATABASE_URL")
#             or os.environ.get("DATABASE_PUBLIC_URL")
#             or getattr(settings, "DATABASE_URL", None)
#             or getattr(settings, "DATABASE_PUBLIC_URL", None)
#             or settings.DATABASE_URL
#         )
#     else:
#         # 1. Use DATABASE_PUBLIC_URL if available (works everywhere)
#         # 2. Fall back to DATABASE_URL (only works inside Railway network)
#         database_url = (
#             os.environ.get("DATABASE_PUBLIC_URL")
#             or os.environ.get("DATABASE_URL")
#             or getattr(settings, "DATABASE_PUBLIC_URL", None)
#             or settings.DATABASE_URL
#         )

# Log which URL we're using
# if "railway.internal" in database_url:
#     logger.warning("Using internal Railway URL - this may not work during build/deploy")
# elif "proxy.rlwy.net" in database_url:
#     logger.info("Using Railway public URL - this should work everywhere")
# elif "localhost" in database_url:
#     logger.info("Using localhost database URL - for development only")
# else:
#     logger.info("Using custom database URL")

# Create engine using shared module
engine = make_engine(database_url)

# We're using pool_pre_ping=True in the engine creation, so we don't need a custom ping listener
# SQLAlchemy will automatically check connections before using them
# is_localhost = "localhost" in database_url or "127.0.0.1" in database_url
# logger.info("Using SQLAlchemy's built-in connection validation with pool_pre_ping=True")


# Create session factory
SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)

# Create base class for models
Base = declarative_base()


# Dependency to get database session
def get_db():
    # Create a new session
    db = SessionLocal()
    try:
        # Yield the session - SQLAlchemy will handle connection validation with pool_pre_ping
        yield db
    finally:
        # Always close the session
        db.close()
