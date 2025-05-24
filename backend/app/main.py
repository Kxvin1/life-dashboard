from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import Response, JSONResponse
from datetime import datetime
from app.core.config import settings
from app.db.database import SessionLocal, engine
from sqlalchemy import text
from sqlalchemy.orm import Session
import json
import time
import logging
import threading
import concurrent.futures

from app.models.task import TaskCategory
from app.models.category import Category, TransactionType
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
from app.api.admin import router as admin_router
from app.db.seed_categories import seed_categories, verify_categories
from app.db.seed_task_categories import (
    seed_task_categories,
    verify_task_categories_async,
)
from app.core.demo_middleware import DemoUserMiddleware
from app.services.scheduler_service import prewarm_scheduler
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
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

ALEMBIC_CFG = Config(str(Path(__file__).parent.parent / "alembic.ini"))


@app.on_event("startup")
def run_migrations() -> None:
    """Ensure DB schema is up to date before serving requests."""
    command.upgrade(ALEMBIC_CFG, "heads")


# Function to warm up database connections
def warmup_db_connection():
    """
    Establish a few database connections to warm up the connection pool.
    This helps avoid the initial connection overhead for the first requests.
    """
    try:
        logger.info("Warming up database connections...")
        # Number of connections to establish during warmup
        num_connections = 5

        # Establish connections sequentially
        for i in range(num_connections):
            establish_db_connection(i)

        logger.info(f"Successfully warmed up {num_connections} database connections")
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
            logger.info(f"Connection {connection_id} established successfully: {value}")
    except Exception as e:
        logger.error(f"Error establishing connection {connection_id}: {str(e)}")


# Function to preload categories into cache (disabled for now)
def preload_categories():
    """
    Preload categories into the cache at application startup.
    Currently disabled to avoid conflicts with Redis service.
    """
    logger.info("Category preloading is currently disabled")


# Start connection warmup and preload data in background threads
@app.on_event("startup")
async def startup_event():
    """Run startup tasks in the background."""
    # Start a background thread for database connection warmup
    threading.Thread(target=warmup_db_connection).start()

    # Start a background thread to preload categories
    threading.Thread(target=preload_categories).start()

    # Start the pre-warming scheduler for production
    await prewarm_scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown tasks."""
    # Stop the pre-warming scheduler
    await prewarm_scheduler.stop()


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

# Add GZip compression middleware for faster responses (lower threshold for demo users)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Configure CORS - Use only FastAPI's CORSMiddleware for simplicity
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://life-dashboard-eta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["X-Process-Time"],
    max_age=600,
)


# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions_router, prefix="/api/v1", tags=["transactions"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(summaries_router, prefix="/api/v1/summaries", tags=["summaries"])
app.include_router(subscriptions_router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(ai_insights_router, prefix="/api/v1", tags=["ai_insights"])
app.include_router(pomodoro_router, prefix="/api/v1", tags=["pomodoro"])
app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(admin_router, prefix="/api/v1", tags=["admin"])
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


@app.get("/redis-health")
async def redis_health_check():
    """
    Check Redis connection health and return statistics.
    This endpoint is useful for diagnosing Redis connection issues.
    """
    from app.services.redis_service import redis_service

    try:
        if redis_service.is_available:
            return {
                "status": "connected",
                "redis_enabled": True,
                "timestamp": str(datetime.now()),
            }
        else:
            return {
                "status": "unavailable",
                "redis_enabled": False,
                "timestamp": str(datetime.now()),
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": str(datetime.now()),
        }


@app.get("/prewarm-health")
async def prewarm_health_check():
    """
    Check pre-warming system health for production monitoring.
    This endpoint is useful for monitoring pre-warming status.
    """
    try:
        scheduler_status = prewarm_scheduler.get_status()

        # Determine overall health
        is_healthy = (
            scheduler_status["scheduler_running"]
            and scheduler_status["prewarm_enabled"]
            and scheduler_status["last_prewarm_success"]
        )

        # Check cache freshness (warn if older than 6 hours)
        cache_freshness_hours = scheduler_status.get("cache_freshness_hours")
        is_cache_fresh = cache_freshness_hours is None or cache_freshness_hours < 6

        return {
            "status": "healthy" if is_healthy and is_cache_fresh else "degraded",
            "scheduler_running": scheduler_status["scheduler_running"],
            "prewarm_enabled": scheduler_status["prewarm_enabled"],
            "last_prewarm_success": scheduler_status["last_prewarm_success"],
            "cache_freshness_hours": cache_freshness_hours,
            "cache_fresh": is_cache_fresh,
            "total_prewarm_count": scheduler_status["total_prewarm_count"],
            "total_error_count": scheduler_status["total_error_count"],
            "timestamp": str(datetime.now()),
        }

    except Exception as e:
        return {
            "status": "error",
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
