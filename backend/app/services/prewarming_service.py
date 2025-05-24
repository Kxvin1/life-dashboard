"""
True Pre-warming Service for Demo User

This service pre-computes and caches API responses for the demo user BEFORE they login,
ensuring instant loading when they access the dashboard.

The service calls the actual API endpoint functions to ensure cache keys and responses
match exactly what the frontend expects.
"""

import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.subscription import SubscriptionStatus
from app.db.database import SessionLocal
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "demo_user@example.com"


class PrewarmingService:
    """Service for pre-warming demo user cache"""

    def __init__(self):
        self.demo_user_id: Optional[int] = None

    def get_demo_user(self, db: Session) -> Optional[User]:
        """Get the demo user from database"""
        demo_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
        if demo_user:
            self.demo_user_id = demo_user.id
        return demo_user

    async def prewarm_all_demo_data(self) -> dict:
        """
        Pre-warm all demo user data by calling actual API functions.
        This ensures cache keys match exactly what the real endpoints use.
        """
        db = SessionLocal()
        try:
            # Get demo user
            demo_user = self.get_demo_user(db)
            if not demo_user:
                logger.error("Demo user not found - cannot pre-warm")
                return {"error": "Demo user not found"}

            logger.info(f"🔥 Starting TRUE pre-warming for demo user {demo_user.id}")

            results = {"user_id": demo_user.id, "prewarmed_endpoints": [], "errors": []}

            # Pre-warm subscriptions
            await self._prewarm_subscriptions(db, demo_user, results)

            # Pre-warm transactions
            await self._prewarm_transactions(db, demo_user, results)

            # Pre-warm tasks
            await self._prewarm_tasks(db, demo_user, results)

            # Pre-warm pomodoro
            await self._prewarm_pomodoro(db, demo_user, results)

            logger.info(f"✅ Pre-warming completed for demo user {demo_user.id}")
            logger.info(
                f"📊 Pre-warmed {len(results['prewarmed_endpoints'])} endpoints"
            )

            return results

        except Exception as e:
            logger.error(f"❌ Pre-warming failed: {str(e)}")
            return {"error": str(e)}
        finally:
            db.close()

    async def _prewarm_subscriptions(self, db: Session, demo_user: User, results: dict):
        """Pre-warm subscription endpoints"""
        try:
            from app.api.subscriptions import (
                get_subscriptions,
                get_subscriptions_summary,
            )
            from fastapi import Response

            # Mock response object
            mock_response = Response()

            # Pre-warm active subscriptions
            try:
                await get_subscriptions(
                    response=mock_response,
                    skip=0,
                    limit=100,
                    status=SubscriptionStatus.active,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("subscriptions_active")
            except Exception as e:
                results["errors"].append(f"subscriptions_active: {str(e)}")

            # Pre-warm inactive subscriptions
            try:
                await get_subscriptions(
                    response=mock_response,
                    skip=0,
                    limit=100,
                    status=SubscriptionStatus.inactive,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("subscriptions_inactive")
            except Exception as e:
                results["errors"].append(f"subscriptions_inactive: {str(e)}")

            # Pre-warm subscription summary
            try:
                await get_subscriptions_summary(
                    response=mock_response, db=db, current_user=demo_user
                )
                results["prewarmed_endpoints"].append("subscription_summary")
            except Exception as e:
                results["errors"].append(f"subscription_summary: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to pre-warm subscriptions: {str(e)}")
            results["errors"].append(f"subscriptions_module: {str(e)}")

    async def _prewarm_transactions(self, db: Session, demo_user: User, results: dict):
        """Pre-warm transaction endpoints"""
        try:
            from app.api.transactions import get_transactions
            from app.api.transaction_summaries import (
                get_monthly_summary,
                get_yearly_summary,
            )
            from fastapi import Response
            from datetime import datetime

            mock_response = Response()
            current_year = datetime.now().year

            # Pre-warm recent transactions
            try:
                await get_transactions(
                    response=mock_response,
                    skip=0,
                    limit=100,
                    type=None,
                    start_date=None,
                    end_date=None,
                    category_id=None,
                    year=None,
                    month=None,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("transactions")
            except Exception as e:
                results["errors"].append(f"transactions: {str(e)}")

            # Pre-warm monthly summary
            try:
                await get_monthly_summary(
                    response=mock_response,
                    year=current_year,
                    month=None,
                    category_id=None,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("monthly_summary")
            except Exception as e:
                results["errors"].append(f"monthly_summary: {str(e)}")

            # Pre-warm yearly summary
            try:
                await get_yearly_summary(
                    response=mock_response,
                    year=current_year,
                    category_id=None,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("yearly_summary")
            except Exception as e:
                results["errors"].append(f"yearly_summary: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to pre-warm transactions: {str(e)}")
            results["errors"].append(f"transactions_module: {str(e)}")

    async def _prewarm_tasks(self, db: Session, demo_user: User, results: dict):
        """Pre-warm task endpoints"""
        try:
            from app.api.tasks import get_tasks
            from fastapi import Response

            mock_response = Response()

            # Pre-warm short-term tasks
            try:
                await get_tasks(
                    response=mock_response,
                    is_long_term=False,
                    status=None,
                    category_id=None,
                    priority=None,
                    due_date_start=None,
                    due_date_end=None,
                    skip=0,
                    limit=10,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("tasks_short_term")
            except Exception as e:
                results["errors"].append(f"tasks_short_term: {str(e)}")

            # Pre-warm long-term tasks
            try:
                await get_tasks(
                    response=mock_response,
                    is_long_term=True,
                    status=None,
                    category_id=None,
                    priority=None,
                    due_date_start=None,
                    due_date_end=None,
                    skip=0,
                    limit=10,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("tasks_long_term")
            except Exception as e:
                results["errors"].append(f"tasks_long_term: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to pre-warm tasks: {str(e)}")
            results["errors"].append(f"tasks_module: {str(e)}")

    async def _prewarm_pomodoro(self, db: Session, demo_user: User, results: dict):
        """Pre-warm pomodoro endpoints"""
        try:
            from app.api.pomodoro import get_pomodoro_sessions, get_pomodoro_counts
            from fastapi import Response

            mock_response = Response()

            # Pre-warm pomodoro sessions
            try:
                await get_pomodoro_sessions(
                    response=mock_response,
                    skip=0,
                    limit=10,
                    db=db,
                    current_user=demo_user,
                )
                results["prewarmed_endpoints"].append("pomodoro_sessions")
            except Exception as e:
                results["errors"].append(f"pomodoro_sessions: {str(e)}")

            # Pre-warm pomodoro counts
            try:
                await get_pomodoro_counts(
                    response=mock_response, db=db, current_user=demo_user
                )
                results["prewarmed_endpoints"].append("pomodoro_counts")
            except Exception as e:
                results["errors"].append(f"pomodoro_counts: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to pre-warm pomodoro: {str(e)}")
            results["errors"].append(f"pomodoro_module: {str(e)}")


# Global instance
prewarming_service = PrewarmingService()
