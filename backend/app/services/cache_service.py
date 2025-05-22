"""
Simple in-memory cache service for frequently accessed data.
"""

import time
from typing import Dict, Any, Tuple, Optional, Callable
import logging
import threading

# from .redis_cache import redis_cache

logger = logging.getLogger(__name__)

# Global cache storage
# Structure: {cache_key: (data, expiry_timestamp)}
_cache: Dict[str, Tuple[Any, float]] = {}

# Lock for thread-safe cache operations
_cache_lock = threading.RLock()


def get_cache(key: str) -> Optional[Any]:
    """
    Get data from cache if it exists and is not expired.
    Tries Redis first, falls back to in-memory cache.

    Args:
        key: The cache key

    Returns:
        The cached data or None if not found or expired
    """
    # Try Redis first
    # if redis_cache.is_available():
    #     redis_result = redis_cache.get(key)
    #     if redis_result is not None:
    #         logger.info(f"Redis cache hit for key: {key}")
    #         return redis_result
    #     logger.info(f"Redis cache miss for key: {key}")

    # Fallback to in-memory cache
    with _cache_lock:
        if key not in _cache:
            logger.info(f"In-memory cache miss for key: {key}")
            return None

        data, expiry = _cache[key]
        current_time = time.time()

        # Check if cache has expired
        if current_time > expiry:
            # Remove expired cache
            logger.info(f"In-memory cache expired for key: {key}, removing")
            del _cache[key]
            return None

        logger.info(
            f"In-memory cache hit for key: {key}, expires in {int(expiry - current_time)} seconds"
        )
        return data


def set_cache(key: str, data: Any, ttl_seconds: int = 300) -> None:
    """
    Store data in cache with expiration.
    Stores in both Redis and in-memory cache for redundancy.

    Args:
        key: The cache key
        data: The data to cache
        ttl_seconds: Time to live in seconds (default: 5 minutes)
    """
    # Store in Redis first
    # if redis_cache.is_available():
    #     redis_success = redis_cache.set(key, data, ttl_seconds)
    #     if redis_success:
    #         logger.info(
    #             f"Stored in Redis cache with key: {key}, expires in {ttl_seconds} seconds"
    #         )
    #     else:
    #         logger.warning(f"Failed to store in Redis cache for key: {key}")

    # Always store in in-memory cache as fallback
    with _cache_lock:
        expiry = time.time() + ttl_seconds
        _cache[key] = (data, expiry)
        logger.info(
            f"Stored in in-memory cache with key: {key}, expires in {ttl_seconds} seconds"
        )


def invalidate_cache(key: str) -> None:
    """
    Remove a specific key from cache.
    Removes from both Redis and in-memory cache.

    Args:
        key: The cache key to remove
    """
    # Remove from Redis
    # if redis_cache.is_available():
    #     redis_success = redis_cache.delete(key)
    #     if redis_success:
    #         logger.info(f"Invalidated Redis cache key: {key}")
    #     else:
    #         logger.warning(f"Failed to invalidate Redis cache key: {key}")

    # Remove from in-memory cache
    with _cache_lock:
        if key in _cache:
            logger.info(f"Invalidating in-memory cache key: {key}")
            del _cache[key]


def invalidate_cache_pattern(pattern: str) -> None:
    """
    Remove all cache keys that contain the given pattern.
    Removes from both Redis and in-memory cache.

    Args:
        pattern: The pattern to match against cache keys
    """
    # Remove from Redis using pattern matching
    # if redis_cache.is_available():
    #     redis_pattern = f"*{pattern}*"  # Redis pattern syntax
    #     deleted_count = redis_cache.delete_pattern(redis_pattern)
    #     logger.info(
    #         f"Invalidated {deleted_count} Redis cache keys with pattern: {pattern}"
    #     )

    # Remove from in-memory cache
    with _cache_lock:
        keys_to_remove = [k for k in _cache.keys() if pattern in k]
        logger.info(
            f"Invalidating in-memory cache with pattern: {pattern}, keys to remove: {keys_to_remove}"
        )

        for key in keys_to_remove:
            del _cache[key]


def invalidate_user_cache(user_id: int, feature: str = None) -> None:
    """
    Remove cache entries for a specific user, optionally filtered by feature.

    Args:
        user_id: The user ID whose cache entries should be invalidated
        feature: Optional feature name to limit invalidation scope (e.g., 'tasks', 'transactions')
    """
    with _cache_lock:
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


def invalidate_task_cache(
    user_id: int, task_id: int = None, is_long_term: bool = None
) -> None:
    """
    Invalidate task-related caches for a specific user and task in a more targeted way.

    This function is more selective than invalidate_user_cache and only invalidates
    the specific caches that are affected by changes to a task.

    Args:
        user_id: The user ID
        task_id: Optional task ID to invalidate specific task cache
        is_long_term: Optional boolean to invalidate only short-term or long-term task caches
    """
    with _cache_lock:
        # Log the cache invalidation for debugging
        logger.info(
            f"Targeted invalidation of task cache for user_id: {user_id}, task_id: {task_id}, is_long_term: {is_long_term}"
        )

        # Create patterns to match
        patterns = []

        if task_id:
            # Invalidate specific task cache
            patterns.append(f"user_{user_id}_task_{task_id}")

        # Invalidate task list caches
        if is_long_term is not None:
            # Only invalidate caches for the specific task type (short-term or long-term)
            patterns.append(f"user_{user_id}_tasks_{is_long_term}")
        else:
            # Invalidate all task list caches
            patterns.append(f"user_{user_id}_tasks_")

        # Invalidate task hierarchy cache
        patterns.append(f"user_{user_id}_task_hierarchy")

        # Find and remove matching keys
        keys_to_remove = []
        for pattern in patterns:
            matching_keys = [k for k in _cache.keys() if pattern in k]
            keys_to_remove.extend(matching_keys)
            logger.info(f"Pattern '{pattern}' matches {len(matching_keys)} keys")

        # Log the keys that will be removed
        logger.info(f"Keys to be removed: {keys_to_remove}")

        # Remove each key
        for key in keys_to_remove:
            logger.info(f"Invalidating task cache key: {key}")
            del _cache[key]

        # Log the remaining cache keys after invalidation
        logger.info(f"Current cache keys after invalidation: {list(_cache.keys())}")


def invalidate_subscription_cache(user_id: int, subscription_id: int = None) -> None:
    """
    Invalidate subscription-related caches for a specific user and subscription.

    This function targets only subscription-related caches to avoid unnecessary cache misses.

    Args:
        user_id: The user ID
        subscription_id: Optional subscription ID to invalidate specific subscription cache
    """
    with _cache_lock:
        # Log the cache invalidation for debugging
        logger.info(
            f"Targeted invalidation of subscription cache for user_id: {user_id}, subscription_id: {subscription_id}"
        )

        # Create patterns to match subscription-related caches only
        patterns = []

        if subscription_id:
            # Invalidate specific subscription cache
            patterns.append(f"user_{user_id}_subscription_{subscription_id}")

        # Always invalidate subscription list caches
        patterns.append(f"user_{user_id}_subscriptions")

        # Invalidate subscription summary cache
        patterns.append(f"user_{user_id}_subscription_summary")

        # Find and remove matching keys
        keys_to_remove = []
        for pattern in patterns:
            matching_keys = [k for k in _cache.keys() if pattern in k]
            keys_to_remove.extend(matching_keys)
            logger.info(f"Pattern '{pattern}' matches {len(matching_keys)} keys")

        # Log the keys that will be removed
        logger.info(f"Keys to be removed: {keys_to_remove}")

        # Remove each key
        for key in keys_to_remove:
            logger.info(f"Invalidating subscription cache key: {key}")
            del _cache[key]

        # Log the remaining cache keys after invalidation
        logger.info(f"Current cache keys after invalidation: {list(_cache.keys())}")


def invalidate_transaction_cache(
    user_id: int, transaction_id: int = None, transaction_type: str = None
) -> None:
    """
    Invalidate transaction-related caches for a specific user and transaction in a more targeted way.

    This function is more selective than invalidate_user_cache and only invalidates
    the specific caches that are affected by changes to a transaction.

    Args:
        user_id: The user ID
        transaction_id: Optional transaction ID to invalidate specific transaction cache
        transaction_type: Optional transaction type (income/expense) to invalidate only that type
    """
    with _cache_lock:
        # Log the cache invalidation for debugging
        logger.info(
            f"Targeted invalidation of transaction cache for user_id: {user_id}, transaction_id: {transaction_id}, type: {transaction_type}"
        )

        # Create patterns to match
        patterns = []

        if transaction_id:
            # Invalidate specific transaction cache
            patterns.append(f"user_{user_id}_transaction_{transaction_id}")

        # Always invalidate all transaction list caches to ensure UI updates
        # Use broader patterns to catch all variations of transaction cache keys
        patterns.extend(
            [
                f"user_{user_id}_transactions",  # Base pattern
                f"user_{user_id}_transaction_summary",  # Summary cache
                f"user_{user_id}_has_transactions",  # Requirements check cache
            ]
        )

        # Find and remove matching keys using more aggressive pattern matching
        keys_to_remove = []

        # For transaction cache invalidation, we need to be more aggressive
        # and remove ALL transaction-related cache keys for this user
        all_cache_keys = list(_cache.keys())

        for key in all_cache_keys:
            # Check if this key is transaction-related for this user
            if (
                f"user_{user_id}_transactions" in key
                or f"user_{user_id}_transaction_summary" in key
                or f"user_{user_id}_has_transactions" in key
            ):
                keys_to_remove.append(key)

        # Also check the original patterns for any other matches
        for pattern in patterns:
            matching_keys = [
                k for k in _cache.keys() if pattern in k and k not in keys_to_remove
            ]
            keys_to_remove.extend(matching_keys)
            logger.info(
                f"Pattern '{pattern}' matches {len(matching_keys)} additional keys: {matching_keys}"
            )

        # Log the keys that will be removed
        logger.info(f"Keys to be removed: {keys_to_remove}")

        # Remove each key
        for key in keys_to_remove:
            logger.info(f"Invalidating transaction cache key: {key}")
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
                logger.info(f"Cache decorator hit for {cache_key}")
                return cached_result

            # Execute function and cache result
            logger.info(f"Cache decorator miss for {cache_key}, executing function")
            start_time = time.time()
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(
                f"Function {func.__name__} executed in {execution_time:.4f} seconds"
            )

            set_cache(cache_key, result, ttl_seconds)
            logger.info(
                f"Stored result in cache with key {cache_key} for {ttl_seconds} seconds"
            )
            return result

        return wrapper

    return decorator
