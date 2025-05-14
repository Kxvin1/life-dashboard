from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import get_current_user
import logging
from typing import Optional, Dict, Any, List
import json

class DemoUserMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle demo user requests.
    
    This middleware intercepts requests from demo users and:
    1. Allows GET requests (read-only operations)
    2. Simulates success for POST/PUT/DELETE requests without actually modifying the database
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Endpoints that should be allowed for demo users (read-only)
        self.allowed_endpoints = [
            "/api/v1/auth/me",
            "/api/v1/auth/logout",
            "/api/v1/categories",
            "/api/v1/transactions",
            "/api/v1/summaries",
            "/api/v1/subscriptions",
        ]
        
        # Endpoints that should be simulated for demo users (write operations)
        self.simulated_endpoints = [
            "/api/v1/transactions/",
            "/api/v1/subscriptions/",
        ]
        
        # Endpoints that should be blocked for demo users
        self.blocked_endpoints = [
            "/api/v1/insights/transactions",  # Block AI insights for demo users
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Only intercept API requests
        if not request.url.path.startswith("/api/v1/"):
            return await call_next(request)
        
        # Check if the user is a demo user
        user = await self._get_current_user(request)
        if not user or not user.is_demo_user:
            return await call_next(request)
        
        # Handle based on request method and path
        if request.method == "GET":
            # Allow all GET requests
            return await call_next(request)
        
        # Block specific endpoints for demo users
        for endpoint in self.blocked_endpoints:
            if request.url.path.startswith(endpoint):
                return Response(
                    content=json.dumps({
                        "detail": "This feature is not available in demo mode."
                    }),
                    status_code=403,
                    media_type="application/json"
                )
        
        # Simulate success for write operations
        for endpoint in self.simulated_endpoints:
            if request.url.path.startswith(endpoint):
                # For POST requests (creating new items)
                if request.method == "POST":
                    # Read the request body
                    body = await request.body()
                    body_dict = json.loads(body)
                    
                    # Add a demo ID to the response
                    body_dict["id"] = 9999  # Demo ID
                    body_dict["user_id"] = user.id
                    
                    # Return a success response without actually writing to the database
                    return Response(
                        content=json.dumps(body_dict),
                        status_code=200,
                        media_type="application/json"
                    )
                
                # For PUT/PATCH requests (updating items)
                elif request.method in ["PUT", "PATCH"]:
                    # Read the request body
                    body = await request.body()
                    body_dict = json.loads(body)
                    
                    # Return a success response without actually writing to the database
                    return Response(
                        content=json.dumps(body_dict),
                        status_code=200,
                        media_type="application/json"
                    )
                
                # For DELETE requests
                elif request.method == "DELETE":
                    # Return a success response without actually deleting from the database
                    return Response(
                        content=json.dumps({"detail": "Item deleted successfully (demo mode)"}),
                        status_code=200,
                        media_type="application/json"
                    )
        
        # For any other requests, proceed normally
        return await call_next(request)
    
    async def _get_current_user(self, request: Request) -> Optional[User]:
        """
        Get the current user from the request.
        """
        try:
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None
            
            token = auth_header.replace("Bearer ", "")
            
            # Get DB session
            db = next(get_db())
            
            # Get user from token
            user = await get_current_user(token=token, db=db)
            return user
        except Exception as e:
            logging.error(f"Error getting current user in demo middleware: {e}")
            return None
