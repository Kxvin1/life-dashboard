"""
Demo User Cache Middleware

Serves precomputed responses instantly for demo users.
This bypasses all database queries and business logic for demo users,
providing instant 0ms responses from Redis cache.
"""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from app.services.redis_service import redis_service
import json
import time

# Demo user email identifier
DEMO_USER_EMAIL = "demo_user@example.com"

class DemoCacheMiddleware:
    """
    Middleware that intercepts API requests for demo users and serves
    precomputed responses from Redis cache for instant loading.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
            
        request = Request(scope, receive)
        
        # Check if this is a demo user request
        if await self.is_demo_user_request(request):
            # Try to serve from precomputed cache
            cached_response = await self.get_precomputed_response(request)
            if cached_response:
                print(f"⚡ INSTANT DEMO RESPONSE: {request.url.path} (0ms)")
                response = JSONResponse(content=cached_response)
                await response(scope, receive, send)
                return
        
        # Not a demo user or no cached response, proceed normally
        await self.app(scope, receive, send)
    
    async def is_demo_user_request(self, request: Request) -> bool:
        """Check if this request is from a demo user"""
        try:
            # Check Authorization header
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return False
                
            token = auth_header.split(" ")[1]
            
            # Check if this token belongs to demo user
            # We can store demo user token in Redis for quick lookup
            demo_token_key = f"demo_user_token"
            stored_token = redis_service.get(demo_token_key)
            
            return token == stored_token
            
        except Exception:
            return False
    
    async def get_precomputed_response(self, request: Request) -> dict | None:
        """Get precomputed response for demo user from Redis"""
        try:
            # Create cache key based on request path and query params
            path = request.url.path
            query_params = str(request.query_params)
            cache_key = f"demo_precomputed:{path}:{query_params}"
            
            # Get precomputed response from Redis
            cached_data = redis_service.get(cache_key)
            return cached_data
            
        except Exception as e:
            print(f"❌ Error getting precomputed response: {e}")
            return None


def create_demo_cache_middleware(app):
    """Factory function to create demo cache middleware"""
    return DemoCacheMiddleware(app)


async def store_demo_user_token(user_id: int, token: str):
    """Store demo user token for quick middleware lookup"""
    demo_token_key = f"demo_user_token"
    redis_service.set(demo_token_key, token, ttl_seconds=86400)  # 24 hours
    print(f"🔑 Stored demo user token for instant middleware lookup")


async def precompute_demo_responses(db, demo_user):
    """
    Precompute all possible API responses for demo user and store in Redis.
    This creates exactly what the frontend will receive, ready to serve instantly.
    """
    print(f"🚀 PRECOMPUTING all demo responses for user {demo_user.id}")
    
    # Import all the API functions we need to precompute
    from app.api.transactions import get_transactions, get_transaction_summary
    from app.api.subscriptions import get_subscriptions, get_subscriptions_summary
    from app.api.summaries import get_summary, get_monthly_summary, get_yearly_summary
    from app.api.tasks import get_tasks
    from app.api.categories import get_categories
    from app.models.user import User as UserModel
    
    # Create mock user object for API calls
    mock_user = UserModel()
    mock_user.id = demo_user.id
    mock_user.email = demo_user.email
    
    # Create mock response object
    class MockResponse:
        def __init__(self):
            pass
    
    mock_response = MockResponse()
    
    try:
        # 1. Precompute transaction categories
        print("📂 Precomputing categories...")
        categories = await get_categories(response=mock_response, db=db)
        redis_service.set("demo_precomputed:/api/v1/categories:", categories, ttl_seconds=86400)
        
        # 2. Precompute transactions (main endpoint)
        print("💰 Precomputing transactions...")
        transactions = await get_transactions(
            response=mock_response, db=db, current_user=mock_user,
            skip=0, limit=100
        )
        redis_service.set("demo_precomputed:/api/v1/transactions/:skip=0&limit=100", transactions, ttl_seconds=3600)
        
        # 3. Precompute account summary
        print("📊 Precomputing account summary...")
        summary = await get_summary(response=mock_response, db=db, current_user=mock_user)
        redis_service.set("demo_precomputed:/api/v1/summary/:", summary, ttl_seconds=1800)
        
        # 4. Precompute monthly summary
        print("📅 Precomputing monthly summary...")
        from datetime import datetime
        current_year = datetime.now().year
        monthly_summary = await get_monthly_summary(
            response=mock_response, db=db, current_user=mock_user, year=current_year
        )
        redis_service.set(f"demo_precomputed:/api/v1/summary/monthly:year={current_year}", monthly_summary, ttl_seconds=1800)
        
        # 5. Precompute yearly summary
        print("📈 Precomputing yearly summary...")
        yearly_summary = await get_yearly_summary(
            response=mock_response, db=db, current_user=mock_user, year=current_year
        )
        redis_service.set(f"demo_precomputed:/api/v1/summary/yearly:year={current_year}", yearly_summary, ttl_seconds=1800)
        
        # 6. Precompute active subscriptions
        print("📱 Precomputing active subscriptions...")
        active_subs = await get_subscriptions(
            response=mock_response, db=db, current_user=mock_user,
            status="active", skip=0, limit=100
        )
        redis_service.set("demo_precomputed:/api/v1/subscriptions/:status=active&skip=0&limit=100", active_subs, ttl_seconds=3600)
        
        # 7. Precompute inactive subscriptions
        print("📱 Precomputing inactive subscriptions...")
        inactive_subs = await get_subscriptions(
            response=mock_response, db=db, current_user=mock_user,
            status="inactive", skip=0, limit=100
        )
        redis_service.set("demo_precomputed:/api/v1/subscriptions/:status=inactive&skip=0&limit=100", inactive_subs, ttl_seconds=3600)
        
        # 8. Precompute subscription summary
        print("💳 Precomputing subscription summary...")
        sub_summary = await get_subscriptions_summary(
            response=mock_response, db=db, current_user=mock_user
        )
        redis_service.set("demo_precomputed:/api/v1/subscriptions-summary/:", sub_summary, ttl_seconds=1800)
        
        # 9. Precompute tasks (short-term)
        print("✅ Precomputing short-term tasks...")
        short_tasks = await get_tasks(
            response=mock_response, db=db, current_user=mock_user,
            is_long_term=False, skip=0, limit=10
        )
        redis_service.set("demo_precomputed:/api/v1/tasks/:is_long_term=False&skip=0&limit=10", short_tasks, ttl_seconds=600)
        
        # 10. Precompute tasks (long-term)
        print("📋 Precomputing long-term tasks...")
        long_tasks = await get_tasks(
            response=mock_response, db=db, current_user=mock_user,
            is_long_term=True, skip=0, limit=10
        )
        redis_service.set("demo_precomputed:/api/v1/tasks/:is_long_term=True&skip=0&limit=10", long_tasks, ttl_seconds=600)
        
        print(f"✅ PRECOMPUTING COMPLETE: All demo responses ready for instant serving!")
        
    except Exception as e:
        print(f"❌ Error precomputing demo responses: {e}")
        # Don't raise - precomputing failure shouldn't break demo creation
