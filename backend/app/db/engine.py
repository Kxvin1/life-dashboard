"""
Shared database engine creation module.
"""

import logging
import socket
import time
from sqlalchemy import create_engine

logger = logging.getLogger(__name__)


# We don't need this function anymore
def wait_for_dns(host: str, timeout: int = 60):
    """Wait for DNS to resolve a hostname - not used anymore."""
    logger.info(f"DNS resolution for {host} skipped - not needed")


def make_engine(url: str):
    """Create a SQLAlchemy engine with appropriate settings."""
    # Normalize URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Ensure URL has correct protocol
    if not url.startswith("postgresql://"):
        raise ValueError(f"Invalid database URL scheme: {url}")

    # Extract components for logging
    try:
        proto, rest = url.split("://", 1)
        if "@" in rest:
            userinfo, hostinfo = rest.split("@", 1)
            if ":" in userinfo:
                user, _ = userinfo.split(":", 1)
            else:
                user = userinfo
        else:
            user = "unknown"
            hostinfo = rest

        # Extract host for DNS check
        if "/" in hostinfo:
            host_and_port, dbname = hostinfo.split("/", 1)
        else:
            host_and_port = hostinfo
            dbname = ""

        if ":" in host_and_port:
            host, port = host_and_port.split(":", 1)
        else:
            host = host_and_port
            port = "5432"
    except Exception as e:
        logger.warning(f"Error parsing database URL: {e}")
        host = "unknown"
        user = "unknown"
        hostinfo = url.split("@")[-1] if "@" in url else "masked"

    # Determine SSL mode
    is_railway_internal = "railway.internal" in url
    sslmode = "disable" if is_railway_internal else "require"

    # Log connection details
    logger.info(f"Connecting as {user} to {hostinfo} with sslmode={sslmode}")

    # Don't wait for DNS - it causes delays and timeouts
    # Railway's internal DNS is only available inside the project network

    # Create and return the engine
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        connect_args={"sslmode": sslmode},
    )
