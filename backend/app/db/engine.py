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

    # Determine connection settings based on the URL
    is_railway_internal = "railway.internal" in url
    is_localhost = "localhost" in url or "127.0.0.1" in url
    sslmode = "disable" if is_railway_internal else "require"

    # if is_railway_internal:
    #     sslmode = "disable"
    # else:
    #     sslmode = (
    #         os.getenv("FORCE_DISABLE_TLS", "false").lower() == "true"
    #         and "disable"
    #         or "require"
    #     )

    # Create engine with appropriate settings
    if is_localhost:
        # For localhost, don't use any SSL settings
        logger.info(f"Creating engine for {masked_url} without SSL (local development)")
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            # No connect_args for localhost
        )
    else:
        # For all other connections, use the determined SSL mode
        logger.info(f"Creating engine for {masked_url} with sslmode={sslmode}")
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            connect_args={
                "sslmode": sslmode,
                "connect_timeout": 10,
            },
        )
