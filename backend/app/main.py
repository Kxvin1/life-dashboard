from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from datetime import datetime
from app.core.config import settings
from app.db.database import SessionLocal
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

app = FastAPI(
    title="Life Dashboard API",
    description="API for managing personal finances, productivity, and more",
    version="1.0.0",
)


# Verify categories in background after startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(verify_categories())
    asyncio.create_task(verify_task_categories_async())


# Configure CORS - Allow specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://life-dashboard-eta.vercel.app",
        # Add any other origins that need access
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
    ],
    expose_headers=["*"],
    max_age=600,
)

# Add demo user middleware
app.add_middleware(DemoUserMiddleware)


# Add CORS headers to all responses
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
    response = await call_next(request)

    # Add CORS headers to the response
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    else:
        # For other origins, still allow but without credentials
        response.headers["Access-Control-Allow-Origin"] = "*"

    return response


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


@app.get("/cors-test")
async def cors_test():
    """
    Simple endpoint to test CORS configuration.
    This endpoint should be accessible from the frontend.
    Only available in development environment.
    """
    # Check if we're in development environment
    if settings.ENVIRONMENT != "development":
        from fastapi import HTTPException, status

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
        from fastapi import HTTPException, status

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
        from fastapi import HTTPException, status

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
