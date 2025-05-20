from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from datetime import datetime
from app.core.config import settings
from app.db.database import SessionLocal, engine
from sqlalchemy import text
import json
import time
import logging
import threading
import concurrent.futures
from app.api import (
    transactions_router,
    health_router,
    auth_router,
    categories_router,
    summaries_router,
    subscriptions_router,
    ai_insights_router,
    pomodoro_router,
    tasks_router,
)
from app.db.seed_categories import seed_categories, verify_categories
from app.db.seed_task_categories import (
    seed_task_categories,
    verify_task_categories_async,
)
from app.core.demo_middleware import DemoUserMiddleware
import asyncio
from alembic import command
from alembic.config import Config
from pathlib import Path

app = FastAPI(
    title="Life Dashboard API",
    description="API for managing personal finances, productivity, and more",
    version="1.0.0",
)

# Configure logging
logger = logging.getLogger(__name__)

ALEMBIC_CFG = Config(str(Path(__file__).parent.parent / "alembic.ini"))


@app.on_event("startup")
def run_migrations() -> None:
    """Ensure DB schema is up to date before serving requests."""
    command.upgrade(ALEMBIC_CFG, "heads")


# Function to warm up database connections
def warmup_db_connection():
    """
    Establish multiple database connections to warm up the connection pool.
    This helps avoid the initial connection overhead for the first requests.
    """
    try:
        logger.info("Warming up database connections...")
        # Number of connections to establish during warmup
        num_connections = 25  # Increased from 10 to 25

        # Use a thread pool to establish multiple connections concurrently
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=num_connections
        ) as executor:
            # Create a list of future objects
            futures = []

            # Submit connection tasks
            for i in range(num_connections):
                futures.append(executor.submit(establish_db_connection, i))

            # Wait for all connections to be established
            concurrent.futures.wait(futures)

        # Now warm up common queries
        logger.info("Warming up common database queries...")
        warm_up_common_queries()

        logger.info(
            f"Successfully warmed up {num_connections} database connections and common queries"
        )
    except Exception as e:
        logger.error(f"Error warming up database connections: {str(e)}")


def establish_db_connection(connection_id):
    """Establish a single database connection."""
    try:
        # Create a connection and execute a simple query
        with engine.connect() as conn:
            # Execute a simple query to establish the connection
            result = conn.execute(text("SELECT 1"))
            value = result.scalar()

            # Execute a few more queries to warm up the connection
            conn.execute(text("SELECT current_timestamp"))

            logger.info(f"Connection {connection_id} established successfully: {value}")
    except Exception as e:
        logger.error(f"Error establishing connection {connection_id}: {str(e)}")


def warm_up_common_queries():
    """Execute common queries to warm up the database cache."""
    try:
        # Create a session
        db = SessionLocal()
        try:
            # Execute common queries that are likely to be used frequently

            # Query 1: Check database version
            db.execute(text("SELECT version()"))

            # Query 2: Get current timestamp
            db.execute(text("SELECT current_timestamp"))

            # Query 3: Count users
            db.execute(text("SELECT COUNT(*) FROM users"))

            # Query 4: Count transactions
            db.execute(text("SELECT COUNT(*) FROM transactions"))

            # Query 5: Count categories
            db.execute(text("SELECT COUNT(*) FROM categories"))

            logger.info("Common queries executed successfully")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error executing common queries: {str(e)}")


# Start connection warmup in a background thread
@app.on_event("startup")
def startup_event():
    """Run startup tasks in the background."""
    # Start a background thread for database connection warmup
    threading.Thread(target=warmup_db_connection).start()


# Add performance monitoring middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # Log requests that take more than 0.5 seconds
    if process_time > 0.5:
        logger.warning(
            f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s"
        )

    return response


# Add demo user middleware
app.add_middleware(DemoUserMiddleware)

# Configure CORS - Allow specific origins (add this AFTER other middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://life-dashboard-eta.vercel.app",
        # Add any other origins that need access
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=600,
)


# Add CORS headers to all responses as a fallback
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Get the origin from the request
    origin = request.headers.get("Origin")

    # List of allowed origins
    allowed_origins = [
        "http://localhost:3000",
        "https://life-dashboard-eta.vercel.app",
    ]

    # For preflight OPTIONS requests
    if request.method == "OPTIONS":
        response = Response(status_code=200)

        # Set CORS headers based on origin
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        else:
            # For other origins, still allow but without credentials
            response.headers["Access-Control-Allow-Origin"] = "*"

        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        )
        response.headers["Access-Control-Allow-Headers"] = (
            "Authorization, Content-Type, Accept, Origin, X-Requested-With"
        )
        response.headers["Access-Control-Max-Age"] = "600"
        return response

    # For all other requests
    try:
        response = await call_next(request)

        # Always add CORS headers to the response
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        else:
            # For other origins, still allow but without credentials
            response.headers["Access-Control-Allow-Origin"] = "*"

        return response
    except Exception as e:
        # If there's an error, still return a response with CORS headers
        print(f"Error in middleware: {str(e)}")

        # Create a proper JSON response
        error_response = JSONResponse(
            status_code=500, content={"detail": "Internal Server Error"}
        )

        # Add CORS headers
        if origin in allowed_origins:
            error_response.headers["Access-Control-Allow-Origin"] = origin
            error_response.headers["Access-Control-Allow-Credentials"] = "true"
        else:
            error_response.headers["Access-Control-Allow-Origin"] = "*"

        # Add other CORS headers
        error_response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        )
        error_response.headers["Access-Control-Allow-Headers"] = (
            "Authorization, Content-Type, Accept, Origin, X-Requested-With"
        )

        return error_response


# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions_router, prefix="/api/v1", tags=["transactions"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(summaries_router, prefix="/api/v1/summaries", tags=["summaries"])
app.include_router(subscriptions_router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(ai_insights_router, prefix="/api/v1", tags=["ai_insights"])
app.include_router(pomodoro_router, prefix="/api/v1", tags=["pomodoro"])
app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(health_router, tags=["health"])


@app.get("/")
async def root():
    return {"message": "Welcome to Finance Tracker API", "status": "healthy"}


@app.get("/db-health")
async def db_health_check():
    """
    Check database connection health and return connection statistics.
    This endpoint is useful for diagnosing database connection issues.
    """
    try:
        # Get connection pool statistics
        pool_status = {
            "pool_size": engine.pool.size(),
            "checkedin": engine.pool.checkedin(),
            "checkedout": engine.pool.checkedout(),
            "overflow": engine.pool.overflow(),
        }

        # Test a simple query
        start_time = time.time()
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT 1")).scalar()
            query_time = time.time() - start_time

            return {
                "status": "healthy",
                "query_result": result,
                "query_time_ms": round(query_time * 1000, 2),
                "pool_status": pool_status,
                "timestamp": str(datetime.now()),
            }
        finally:
            db.close()
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": str(datetime.now()),
        }


@app.get("/cors-test")
async def cors_test():
    """
    Simple endpoint to test CORS configuration.
    This endpoint should be accessible from the frontend.
    Only available in development environment.
    """
    # Check if we're in development environment
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint not available in production",
        )

    return {
        "message": "CORS is working correctly!",
        "status": "success",
        "timestamp": str(datetime.now()),
    }


@app.post("/api/v1/seed-categories")
async def seed_categories_endpoint():
    """
    Seed categories endpoint.
    Only available in development environment.
    """
    # Check if we're in development environment
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint not available in production",
        )

    try:
        seed_categories()
        return {"message": "Categories seeded successfully"}
    except Exception as e:
        return {"message": f"Error seeding categories: {str(e)}", "status": "error"}


@app.post("/api/v1/seed-task-categories")
async def seed_task_categories_endpoint():
    """
    Seed task categories endpoint.
    Only available in development environment.
    """
    # Check if we're in development environment
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint not available in production",
        )

    try:
        db = SessionLocal()
        try:
            seed_task_categories(db)
            return {"message": "Task categories seeded successfully"}
        finally:
            db.close()
    except Exception as e:
        return {
            "message": f"Error seeding task categories: {str(e)}",
            "status": "error",
        }
