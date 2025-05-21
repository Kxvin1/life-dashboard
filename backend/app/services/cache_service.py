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
            key_parts.extend([str(arg) for arg in args])
            key_parts.extend([f"{k}={v}" for k, v in kwargs.items()])
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
