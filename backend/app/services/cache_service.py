"""
Simple in-memory cache service for frequently accessed data.
"""

import time
from typing import Dict, Any, Tuple, Optional, Callable
import logging

logger = logging.getLogger(__name__)

# Global cache storage
# Structure: {cache_key: (data, expiry_timestamp)}
_cache: Dict[str, Tuple[Any, float]] = {}


def get_cache(key: str) -> Optional[Any]:
    """
    Get data from cache if it exists and is not expired.

    Args:
        key: The cache key

    Returns:
        The cached data or None if not found or expired
    """
    if key not in _cache:
        return None

    data, expiry = _cache[key]
    current_time = time.time()

    # Check if cache has expired
    if current_time > expiry:
        # Remove expired cache
        del _cache[key]
        return None

    return data


def set_cache(key: str, data: Any, ttl_seconds: int = 300) -> None:
    """
    Store data in cache with expiration.

    Args:
        key: The cache key
        data: The data to cache
        ttl_seconds: Time to live in seconds (default: 5 minutes)
    """
    expiry = time.time() + ttl_seconds
    _cache[key] = (data, expiry)


def invalidate_cache(key: str) -> None:
    """
    Remove a specific key from cache.

    Args:
        key: The cache key to remove
    """
    if key in _cache:
        del _cache[key]


def invalidate_cache_pattern(pattern: str) -> None:
    """
    Remove all cache keys that contain the given pattern.

    Args:
        pattern: The pattern to match against cache keys
    """
    keys_to_remove = [k for k in _cache.keys() if pattern in k]
    for key in keys_to_remove:
        del _cache[key]


def invalidate_user_cache(user_id: int, feature: str = None) -> None:
    """
    Remove cache entries for a specific user, optionally filtered by feature.

    Args:
        user_id: The user ID whose cache entries should be invalidated
        feature: Optional feature name to limit invalidation scope (e.g., 'tasks', 'transactions')
    """
    # Log the cache invalidation for debugging
    logger.info(f"Invalidating cache for user_id: {user_id}, feature: {feature}")

    # Create a pattern that will match user-specific cache entries
    user_pattern = f"user_{user_id}"

    if feature:
        # If a feature is specified, only invalidate cache entries for that feature
        pattern = f"{user_pattern}_{feature}"
        logger.info(f"Invalidating cache with pattern: {pattern}")

        # Find all keys that match the pattern
        keys_to_remove = [k for k in _cache.keys() if pattern in k]
    else:
        # If no feature is specified, invalidate all user cache entries
        logger.info(f"Invalidating all cache for user: {user_pattern}")

        # Find all keys that contain the user pattern
        keys_to_remove = [k for k in _cache.keys() if user_pattern in k]

    # Log the keys that will be removed
    logger.info(f"Keys to be removed: {keys_to_remove}")

    # Remove each key
    for key in keys_to_remove:
        del _cache[key]

    # Log the remaining cache keys after invalidation
    logger.info(f"Current cache keys after invalidation: {list(_cache.keys())}")


def cached(ttl_seconds: int = 300):
    """
    Decorator to cache function results.

    Args:
        ttl_seconds: Time to live in seconds (default: 5 minutes)

    Returns:
        Decorated function with caching
    """

    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Create a cache key from function name and arguments
            key_parts = [func.__name__]

            # Add user_id to the cache key if it exists in args or kwargs
            # This ensures each user has their own cache entries
            user_id = None

            # Check if first argument is a User object (common pattern in our services)
            if args and hasattr(args[0], "id") and hasattr(args[0], "email"):
                user_id = f"user_{args[0].id}"
                key_parts.append(user_id)

            # Also check for user_id in kwargs
            elif "user_id" in kwargs:
                user_id = f"user_{kwargs['user_id']}"
                key_parts.append(user_id)

            # Check for current_user in kwargs (common in FastAPI dependencies)
            elif "current_user" in kwargs and hasattr(kwargs["current_user"], "id"):
                user_id = f"user_{kwargs['current_user'].id}"
                key_parts.append(user_id)

            # Add the rest of the arguments to the key
            key_parts.extend(
                [
                    str(arg)
                    for arg in args
                    if not hasattr(arg, "id") or not hasattr(arg, "email")
                ]
            )
            key_parts.extend(
                [
                    f"{k}={v}"
                    for k, v in kwargs.items()
                    if k not in ["user_id", "current_user"]
                ]
            )

            cache_key = ":".join(key_parts)

            # Try to get from cache
            cached_result = get_cache(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result

            # Execute function and cache result
            result = func(*args, **kwargs)
            set_cache(cache_key, result, ttl_seconds)
            logger.debug(f"Cache miss for {cache_key}, stored result")
            return result

        return wrapper

    return decorator
