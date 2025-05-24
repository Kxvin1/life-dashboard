"""
Production-ready background scheduler for demo user pre-warming.
Uses APScheduler to run pre-warming tasks automatically in production.
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from app.core.config import settings
from app.services.prewarming_service import prewarming_service

logger = logging.getLogger(__name__)


class PrewarmingScheduler:
    """Background scheduler for automatic demo user pre-warming"""
    
    def __init__(self):
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.is_running = False
        self.last_prewarm_time: Optional[datetime] = None
        self.last_prewarm_success = False
        self.prewarm_count = 0
        self.error_count = 0
    
    async def start(self):
        """Start the background scheduler"""
        if not settings.PREWARM_ENABLED:
            logger.info("🔥 Pre-warming scheduler disabled via configuration")
            return
        
        if self.scheduler is not None:
            logger.warning("Scheduler already running")
            return
        
        logger.info("🔥 Starting pre-warming scheduler for production")
        
        self.scheduler = AsyncIOScheduler()
        
        # Schedule regular pre-warming every 2 hours
        self.scheduler.add_job(
            self._run_prewarm_job,
            trigger=IntervalTrigger(hours=settings.PREWARM_INTERVAL_HOURS),
            id="demo_prewarm_regular",
            name="Demo User Pre-warming (Regular)",
            max_instances=1,  # Prevent overlapping jobs
            coalesce=True,    # Combine missed jobs
            misfire_grace_time=300,  # 5 minutes grace period
        )
        
        # Schedule daily cache refresh at low-traffic time (3 AM UTC)
        self.scheduler.add_job(
            self._run_prewarm_job,
            trigger=CronTrigger(hour=3, minute=0),
            id="demo_prewarm_daily",
            name="Demo User Pre-warming (Daily Refresh)",
            max_instances=1,
            coalesce=True,
        )
        
        self.scheduler.start()
        self.is_running = True
        
        # Run initial pre-warming after a short delay
        asyncio.create_task(self._initial_prewarm())
        
        logger.info("✅ Pre-warming scheduler started successfully")
    
    async def stop(self):
        """Stop the background scheduler"""
        if self.scheduler is None:
            return
        
        logger.info("🛑 Stopping pre-warming scheduler")
        self.scheduler.shutdown(wait=True)
        self.scheduler = None
        self.is_running = False
        logger.info("✅ Pre-warming scheduler stopped")
    
    async def _initial_prewarm(self):
        """Run initial pre-warming after startup delay"""
        # Wait for application to fully start
        await asyncio.sleep(settings.PREWARM_STARTUP_DELAY_SECONDS)
        
        logger.info("🔥 Running initial pre-warming after startup")
        await self._run_prewarm_job()
    
    async def _run_prewarm_job(self):
        """Execute the pre-warming job with error handling"""
        job_start = datetime.now()
        
        try:
            logger.info(f"🔥 Starting scheduled pre-warming job at {job_start}")
            
            # Run the pre-warming
            result = await prewarming_service.prewarm_all_demo_data()
            
            # Update statistics
            self.last_prewarm_time = job_start
            self.prewarm_count += 1
            
            if "error" in result:
                self.last_prewarm_success = False
                self.error_count += 1
                logger.error(f"❌ Pre-warming job failed: {result['error']}")
            else:
                self.last_prewarm_success = True
                endpoints_count = len(result.get('prewarmed_endpoints', []))
                errors_count = len(result.get('errors', []))
                
                duration = (datetime.now() - job_start).total_seconds()
                
                logger.info(
                    f"✅ Pre-warming job completed successfully in {duration:.2f}s"
                )
                logger.info(
                    f"📊 Pre-warmed {endpoints_count} endpoints, {errors_count} errors"
                )
                
                if errors_count > 0:
                    logger.warning(f"⚠️ Pre-warming errors: {result.get('errors', [])}")
        
        except Exception as e:
            self.last_prewarm_success = False
            self.error_count += 1
            self.last_prewarm_time = job_start
            
            logger.error(f"❌ Pre-warming job crashed: {str(e)}", exc_info=True)
    
    def get_status(self) -> dict:
        """Get current scheduler status for health checks"""
        return {
            "scheduler_running": self.is_running,
            "prewarm_enabled": settings.PREWARM_ENABLED,
            "last_prewarm_time": self.last_prewarm_time.isoformat() if self.last_prewarm_time else None,
            "last_prewarm_success": self.last_prewarm_success,
            "total_prewarm_count": self.prewarm_count,
            "total_error_count": self.error_count,
            "next_scheduled_jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in (self.scheduler.get_jobs() if self.scheduler else [])
            ],
            "cache_freshness_hours": (
                (datetime.now() - self.last_prewarm_time).total_seconds() / 3600
                if self.last_prewarm_time else None
            )
        }
    
    async def trigger_manual_prewarm(self) -> dict:
        """Manually trigger pre-warming (for admin endpoints)"""
        logger.info("🔥 Manual pre-warming triggered")
        await self._run_prewarm_job()
        return self.get_status()


# Global scheduler instance
prewarm_scheduler = PrewarmingScheduler()
