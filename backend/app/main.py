from fastapi import FastAPI, Request
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
    allow_origins=["*"],  # Temporarily allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=600
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
app.include_router(health.router, tags=["health"])

@app.get("/")
async def root():
    return {"message": "Welcome to Finance Tracker API", "status": "healthy"} 