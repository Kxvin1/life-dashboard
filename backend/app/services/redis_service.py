"""
Simple Redis caching service for Life Dashboard
Only caches the slowest endpoints with simple TTL-based expiration
"""

import json
import logging
from typing import Any, Optional
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisService:
    """Simple Redis service for caching API responses"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.is_available = False
        self._connect()

    def _connect(self):
        """Connect to Redis if enabled and available"""
        if not settings.REDIS_ENABLED:
            logger.info("Redis is disabled via configuration")
            return

        try:
            # Connect to Redis
            if settings.REDIS_URL:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                )
            else:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                )

            # Test connection
            self.redis_client.ping()
            self.is_available = True
            logger.info("✅ Redis connected successfully")

        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            logger.info("Falling back to no caching")
            self.redis_client = None
            self.is_available = False

    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        if not self.is_available:
            return None

        try:
            value = self.redis_client.get(key)
            if value is None:
                return None

            # Try to parse as JSON, fallback to string
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        except Exception as e:
            logger.warning(f"Redis get failed for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Set value in Redis cache with TTL"""
        if not self.is_available:
            return False

        try:
            # Serialize value as JSON with better handling
            def json_serializer(obj):
                """Custom JSON serializer for complex objects"""
                if hasattr(obj, "__dict__"):
                    # Handle SQLAlchemy objects
                    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
                elif hasattr(obj, "isoformat"):
                    # Handle datetime objects
                    return obj.isoformat()
                elif hasattr(obj, "value"):
                    # Handle enum objects
                    return obj.value
                else:
                    return str(obj)

            serialized_value = json.dumps(value, default=json_serializer)
            self.redis_client.setex(key, ttl_seconds, serialized_value)
            return True

        except Exception as e:
            logger.warning(f"Redis set failed for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from Redis cache"""
        if not self.is_available:
            return False

        try:
            self.redis_client.delete(key)
            return True

        except Exception as e:
            logger.warning(f"Redis delete failed for key {key}: {e}")
            return False

    def clear_user_cache(self, user_id: int) -> int:
        """Clear all cache entries for a specific user"""
        if not self.is_available:
            return 0

        try:
            pattern = f"user_{user_id}_*"
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Cleared {deleted} cache entries for user {user_id}")
                return deleted
            return 0

        except Exception as e:
            logger.warning(f"Redis clear_user_cache failed for user {user_id}: {e}")
            return 0


# Global Redis service instance
redis_service = RedisService()
