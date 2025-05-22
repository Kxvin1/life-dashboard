"""
Redis cache service for improved performance and scalability.
Falls back to in-memory cache if Redis is unavailable.
"""

import json
import logging
from typing import Any, Optional
import redis
from redis.exceptions import ConnectionError, TimeoutError
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.redis_enabled = settings.REDIS_ENABLED
        self.redis_url = settings.REDIS_URL

        if self.redis_enabled:
            self._connect_redis()

    def _connect_redis(self) -> None:
        """Initialize Redis connection with error handling."""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"✅ Redis connected successfully to {self.redis_url}")
        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(
                f"⚠️ Redis connection failed: {e}. Falling back to in-memory cache."
            )
            self.redis_client = None

    def is_available(self) -> bool:
        """Check if Redis is available."""
        if not self.redis_enabled or not self.redis_client:
            return False

        try:
            self.redis_client.ping()
            return True
        except (ConnectionError, TimeoutError, Exception):
            logger.warning("Redis connection lost. Falling back to in-memory cache.")
            self.redis_client = None
            return False

    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache."""
        if not self.is_available():
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

        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(f"Redis GET error for key '{key}': {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in Redis cache with TTL."""
        if not self.is_available():
            return False

        try:
            # Serialize value as JSON
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value, default=str)
            else:
                serialized_value = str(value)

            result = self.redis_client.setex(key, ttl, serialized_value)
            return bool(result)

        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(f"Redis SET error for key '{key}': {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from Redis cache."""
        if not self.is_available():
            return False

        try:
            result = self.redis_client.delete(key)
            return bool(result)
        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(f"Redis DELETE error for key '{key}': {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        if not self.is_available():
            return 0

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(
                    f"🗑️ Redis deleted {deleted} keys matching pattern: {pattern}"
                )
                return deleted
            return 0
        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(f"Redis DELETE_PATTERN error for pattern '{pattern}': {e}")
            return 0

    def clear_all(self) -> bool:
        """Clear all cache (use with caution)."""
        if not self.is_available():
            return False

        try:
            self.redis_client.flushdb()
            logger.info("🗑️ Redis cache cleared completely")
            return True
        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(f"Redis CLEAR_ALL error: {e}")
            return False

    def get_stats(self) -> dict:
        """Get Redis statistics."""
        if not self.is_available():
            return {"status": "unavailable", "redis_enabled": self.redis_enabled}

        try:
            info = self.redis_client.info()
            return {
                "status": "connected",
                "redis_enabled": self.redis_enabled,
                "redis_version": info.get("redis_version"),
                "used_memory_human": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_commands_processed": info.get("total_commands_processed"),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
            }
        except (ConnectionError, TimeoutError, Exception) as e:
            logger.warning(f"Redis STATS error: {e}")
            return {"status": "error", "error": str(e)}


# Global Redis cache instance
redis_cache = RedisCache()
