from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.core.config import settings
from app.api import (
    transactions_router,
    health_router,
    auth_router,
    categories_router,
    summaries_router,
    subscriptions_router,
)
from app.db.seed_categories import seed_categories, verify_categories
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


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://life-dashboard-eta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# Add OPTIONS handler for all routes
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = request.headers.get(
            "Origin", "*"
        )
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "600"
        return response
    response = await call_next(request)
    return response


# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions_router, prefix="/api/v1", tags=["transactions"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(summaries_router, prefix="/api/v1/summaries", tags=["summaries"])
app.include_router(subscriptions_router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(health_router, tags=["health"])


@app.get("/")
async def root():
    return {"message": "Welcome to Finance Tracker API", "status": "healthy"}


@app.post("/api/v1/seed-categories")
async def seed_categories_endpoint():
    try:
        seed_categories()
        return {"message": "Categories seeded successfully"}
    except Exception as e:
        return {"message": f"Error seeding categories: {str(e)}", "status": "error"}
