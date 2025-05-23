import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Frontend cache to prevent duplicate API calls
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class FrontendCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 3600000; // 1 hour (3600 seconds)

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  clearPattern(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const frontendCache = new FrontendCache();

// Request deduplication to prevent multiple simultaneous requests
const pendingRequests = new Map<string, Promise<any>>();

export const fetchMonthlySummary = async (
  year: number,
  month?: number | null,
  categoryId?: number | null
) => {
  try {
    // Create cache key
    const cacheKey = `monthly_summary_${year}_${month}_${categoryId}`;

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Check if there's already a pending request for this key
    if (pendingRequests.has(cacheKey)) {
      return await pendingRequests.get(cacheKey)!;
    }

    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Build URL with query parameters
    let url = `${API_URL}/api/v1/summaries/monthly?year=${year}`;
    if (month) url += `&month=${month}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    // Create the request promise and store it
    const requestPromise = fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch monthly summary");
        }

        const data = await response.json();

        // Cache the result for 1 hour
        frontendCache.set(cacheKey, data);

        return data;
      })
      .finally(() => {
        // Remove from pending requests when done
        pendingRequests.delete(cacheKey);
      });

    // Store the pending request
    pendingRequests.set(cacheKey, requestPromise);

    return await requestPromise;
  } catch (error) {
    throw error;
  }
};

export const fetchYearlySummary = async (
  year: number,
  categoryId?: number | null
) => {
  try {
    // Create cache key
    const cacheKey = `yearly_summary_${year}_${categoryId}`;

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Check if there's already a pending request for this key
    if (pendingRequests.has(cacheKey)) {
      return await pendingRequests.get(cacheKey)!;
    }

    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Build URL with query parameters
    let url = `${API_URL}/api/v1/summaries/yearly?year=${year}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    // Create the request promise and store it
    const requestPromise = fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch yearly summary");
        }

        const data = await response.json();

        // Cache the result for 1 hour
        frontendCache.set(cacheKey, data);

        return data;
      })
      .finally(() => {
        // Remove from pending requests when done
        pendingRequests.delete(cacheKey);
      });

    // Store the pending request
    pendingRequests.set(cacheKey, requestPromise);

    return await requestPromise;
  } catch (error) {
    throw error;
  }
};

// Export the cache for external clearing if needed
export const summaryCache = {
  clear: () => frontendCache.clear(),
  clearPattern: (pattern: string) => frontendCache.clearPattern(pattern),
};
