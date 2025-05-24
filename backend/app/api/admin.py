"""
Admin endpoints for system management
"""

from fastapi import APIRouter, HTTPException, status
from app.services.prewarming_service import prewarming_service
from app.services.scheduler_service import prewarm_scheduler
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/admin/prewarm-demo", status_code=status.HTTP_200_OK)
async def prewarm_demo_user():
    """
    Manually trigger pre-warming for demo user.
    This endpoint pre-computes and caches all API responses for instant demo loading.
    """
    try:
        logger.info("🔥 Manual pre-warming triggered for demo user")

        # Use the scheduler's manual trigger method for consistency
        scheduler_status = await prewarm_scheduler.trigger_manual_prewarm()

        return {
            "message": "Demo user pre-warming completed successfully",
            "scheduler_status": scheduler_status,
        }

    except Exception as e:
        logger.error(f"❌ Pre-warming endpoint failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pre-warming failed: {str(e)}",
        )


@router.get("/admin/demo-status", status_code=status.HTTP_200_OK)
async def get_demo_status():
    """
    Get status of demo user and cache
    """
    try:
        from app.db.database import SessionLocal
        from app.models.user import User
        from app.services.redis_service import redis_service

        db = SessionLocal()
        try:
            # Check if demo user exists
            demo_user = (
                db.query(User).filter(User.email == "demo_user@example.com").first()
            )

            if not demo_user:
                return {
                    "demo_user_exists": False,
                    "redis_available": redis_service.is_available,
                    "message": "Demo user not found",
                }

            # Check some cache keys
            cache_keys_to_check = [
                f"user_{demo_user.id}_subscriptions_active_0_100",
                f"user_{demo_user.id}_transactions_None_None_None_None_None_None_0_100",
                f"user_{demo_user.id}_tasks_False_None_None_None_None_None_0_10",
                f"user_{demo_user.id}_pomodoro_sessions_0_10",
            ]

            cached_data = {}
            for key in cache_keys_to_check:
                cached_data[key] = redis_service.get(key) is not None

            return {
                "demo_user_exists": True,
                "demo_user_id": demo_user.id,
                "redis_available": redis_service.is_available,
                "cached_endpoints": cached_data,
                "message": "Demo user status retrieved",
            }

        finally:
            db.close()

    except Exception as e:
        logger.error(f"❌ Demo status check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status check failed: {str(e)}",
        )


@router.get("/admin/prewarm-status", status_code=status.HTTP_200_OK)
async def get_prewarm_status():
    """
    Get detailed pre-warming scheduler status for production monitoring
    """
    try:
        scheduler_status = prewarm_scheduler.get_status()

        return {
            "message": "Pre-warming status retrieved successfully",
            "status": scheduler_status,
        }

    except Exception as e:
        logger.error(f"❌ Scheduler status check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheduler status check failed: {str(e)}",
        )
