from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else [
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://*.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600  # Cache preflight requests for 10 minutes
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
app.include_router(health.router, tags=["health"])

@app.get("/")
async def root():
    return {"message": "Welcome to Finance Tracker API", "status": "healthy"} 