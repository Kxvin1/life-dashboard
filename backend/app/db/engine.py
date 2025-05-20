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

    # Use 'prefer' instead of 'require' for production to improve performance
    # 'prefer' will try SSL first but fall back to non-SSL if that fails
    # This is more efficient than 'require' which will only use SSL
    sslmode = "disable" if is_railway_internal else "prefer"

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
            pool_size=20,  # Increased from 5 to handle more concurrent connections
            max_overflow=20,  # Increased from 10 to handle more concurrent connections
            # No connect_args for localhost
        )
    else:
        # For all other connections, use the determined SSL mode
        logger.info(f"Creating engine for {masked_url} with sslmode={sslmode}")
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=20,  # Increased from 5 to handle more concurrent connections
            max_overflow=20,  # Increased from 10 to handle more concurrent connections
            connect_args={
                "sslmode": sslmode,
                "connect_timeout": 15,  # Increased from 10 to allow more time for connection
                "keepalives": 1,  # Enable TCP keepalives
                "keepalives_idle": 60,  # Seconds between TCP keepalives
                "keepalives_interval": 10,  # Seconds between keepalive retransmits
                "keepalives_count": 3,  # Number of keepalive retransmits before connection is considered dead
            },
        )
