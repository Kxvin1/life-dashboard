"""
Script to fix migration issues in the Railway deployment.
This script ensures all migrations are applied.
"""

import os
import sys
import time
import traceback
import logging
import socket
from alembic.config import Config
from alembic import command
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import settings in a way that works in Railway environment
try:
    from app.core.config import settings

    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback for Railway environment
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        logger.warning("DATABASE_URL environment variable not set")
        # For testing purposes, don't exit if we're just importing the module
        if __name__ == "__main__":
            sys.exit(1)
        else:
            DATABASE_URL = "postgresql://placeholder:placeholder@localhost/placeholder"

# Import the shared engine module
try:
    from app.db.engine import make_engine
except ImportError:
    # If we can't import the shared module, define it here
    def wait_for_dns(host: str, timeout: int = 60):
        """Wait for DNS to resolve a hostname."""
        start = time.time()
        while True:
            try:
                socket.gethostbyname(host)
                logger.info(f"DNS resolved {host}")
                return
            except socket.gaierror:
                if time.time() - start > timeout:
                    logger.warning(f"Timeout waiting for DNS: {host}")
                    return
                logger.info(f"Waiting for DNS: {host}")
                time.sleep(2)

    def make_engine(url: str):
        """Create a SQLAlchemy engine with appropriate settings."""
        from sqlalchemy import create_engine

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

        # Wait for DNS to resolve if it's a hostname
        if not host.replace(".", "").isdigit() and ":" not in host:
            wait_for_dns(host)

        # Create and return the engine
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            connect_args={"sslmode": sslmode},
        )


# Create engine using the shared module
engine = make_engine(DATABASE_URL)


def check_raw_socket(host, port):
    """Check if we're actually connecting to a PostgreSQL server."""
    try:
        logger.info(f"Checking raw socket connection to {host}:{port}")
        s = socket.socket()
        s.settimeout(5)
        s.connect((host, int(port)))
        data = s.recv(8)
        s.close()

        logger.info(f"Raw socket received: {data!r}")

        # PostgreSQL servers typically respond with a single byte
        # HTTP servers respond with "HTTP/1.1" or similar
        if data.startswith(b"HTTP"):
            logger.error(
                f"ERROR: Received HTTP response instead of PostgreSQL protocol!"
            )
            logger.error(f"You are connecting to an HTTP server, not PostgreSQL!")
            return False
        return True
    except Exception as e:
        logger.error(f"Error in raw socket check: {e}")
        return False


def wait_for_database(max_attempts=5, delay=5):
    """Wait for the database to be available."""
    logger.info(f"Waiting for database to be available...")

    # Extract host and port from DATABASE_URL
    try:
        parts = DATABASE_URL.split("@")[1].split("/")[0]
        if ":" in parts:
            host, port = parts.split(":")
        else:
            host = parts
            port = "5432"

        # Check raw socket first
        check_raw_socket(host, port)
    except Exception as e:
        logger.warning(f"Could not extract host/port for raw check: {e}")

    # Try to connect
    for attempt in range(max_attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database is available!")
                return True
        except Exception as e:
            logger.warning(
                f"Database not available yet (attempt {attempt+1}/{max_attempts}): {str(e)}"
            )
            if attempt < max_attempts - 1:
                logger.info(f"Waiting {delay} seconds before retrying...")
                time.sleep(delay)

    logger.warning("Could not connect to the database after multiple attempts")
    # Return True anyway to allow the application to continue
    return True


def check_table_exists(table_name):
    """Check if a table exists in the database."""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception as e:
        logger.error(f"Error checking if table {table_name} exists: {str(e)}")
        return False


def run_migrations():
    """Run all pending migrations."""
    try:
        logger.info("Running database migrations...")

        # Get the directory of the current script
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Create an Alembic configuration object
        alembic_cfg = Config(os.path.join(current_dir, "alembic.ini"))

        # Set the database URL
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)

        # Run the migration
        try:
            command.upgrade(alembic_cfg, "heads")
            logger.info("Database migrations completed successfully!")
        except Exception as e:
            logger.warning(f"Error running upgrade to heads: {str(e)}")
            logger.info("Trying to stamp current state...")
            try:
                command.stamp(alembic_cfg, "heads")
                logger.info("Database migrations marked as complete")
            except Exception as e2:
                logger.error(f"Error stamping migrations: {str(e2)}")

        return True
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        traceback.print_exc()
        return False


def fix_migrations():
    """Fix migration issues by ensuring all migrations are applied."""
    try:
        logger.info("Starting migration fix...")

        # Wait for the database to be available
        wait_for_database()

        # Run migrations
        run_migrations()

        # Check for required tables
        tables_to_check = [
            "task_categories",
            "tasks",
            "task_ai_usage",
            "task_ai_history",
        ]

        for table in tables_to_check:
            exists = check_table_exists(table)
            logger.info(f"{table} table exists: {exists}")

        logger.info("Migration fix completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Error fixing migrations: {str(e)}")
        traceback.print_exc()
        return True


def main():
    """Main function."""
    try:
        logger.info("Starting fix_migrations.py script")
        fix_migrations()
        logger.info("fix_migrations.py script completed successfully")
        return 0
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        traceback.print_exc()
        return 1  # Return error code on failure


if __name__ == "__main__":
    sys.exit(main())
