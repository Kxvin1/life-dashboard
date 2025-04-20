from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.core.config import settings
from app.api import transactions, health, auth

app = FastAPI(
    title="Finance Tracker API",
    description="API for managing personal finances",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://life-dashboard-hxv8qc7ih-kxvin1s-projects.vercel.app",
        "https://life-dashboard.vercel.app",
        "https://life-dashboard-eta.vercel.app",
        "https://*.vercel.app"  # Allow any Vercel deployment
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600
)

# Add OPTIONS handler for all routes
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "600"
        return response
    response = await call_next(request)
    return response

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
app.include_router(health.router, tags=["health"])

@app.get("/")
async def root():
    return {"message": "Welcome to Finance Tracker API", "status": "healthy"} 