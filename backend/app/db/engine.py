"""
Shared database engine creation module.
"""

import logging
from sqlalchemy import create_engine

logger = logging.getLogger(__name__)


def make_engine(url: str):
    """Create a SQLAlchemy engine with appropriate settings."""
    # Normalize URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Ensure URL has correct protocol
    if not url.startswith("postgresql://"):
        raise ValueError(f"Invalid database URL scheme: {url}")

    # Mask the URL for logging
    masked_url = url.split("@")[1] if "@" in url else "masked"

    # Determine SSL mode based on the URL
    is_railway_internal = "railway.internal" in url
    sslmode = "disable" if is_railway_internal else "require"

    # Log connection details
    logger.info(f"Creating engine for {masked_url} with sslmode={sslmode}")

    # Create and return the engine
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        connect_args={"sslmode": sslmode},
    )
