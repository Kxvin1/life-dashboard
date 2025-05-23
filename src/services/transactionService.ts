import Cookies from "js-cookie";
import { Transaction } from "@/types/finance";
import { cacheManager } from "@/lib/cacheManager";

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

export interface TransactionFilters {
  year?: number;
  month?: number;
  category_id?: number;
  type?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

export const fetchTransactions = async (
  filters: TransactionFilters = {}
): Promise<Transaction[]> => {
  try {
    // Create cache key based on filters
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const cacheKey = `transactions_${filterString}`;

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
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const url = `${API_URL}/api/v1/transactions/?${params.toString()}`;

    // Create the request promise and store it
    const requestPromise = fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
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

export const createTransaction = async (
  transaction: Omit<Transaction, "id">
): Promise<Transaction> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/transactions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error("Failed to create transaction");
    }

    // Clear frontend cache
    frontendCache.clearPattern("transactions");

    // Clear summary service cache (since transactions affect monthly/yearly summaries)
    try {
      const summaryService = await import("@/services/summaryService");
      summaryService.clearSummaryCache();
    } catch (e) {
      // Ignore if service not loaded
    }

    // Clear account summary cache (since transactions affect it)
    try {
      const { clearAccountSummaryCache } = await import(
        "@/components/dashboard/DashboardAccountSummary"
      );
      clearAccountSummaryCache();
    } catch (e) {
      // Ignore if component not loaded
    }

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateTransaction = async (
  id: string,
  transaction: Partial<Transaction>
): Promise<Transaction> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update transaction: ${errorText}`);
    }

    // Clear frontend cache
    frontendCache.clearPattern("transactions");

    // Clear summary service cache (since transactions affect monthly/yearly summaries)
    try {
      const summaryService = await import("@/services/summaryService");
      summaryService.clearSummaryCache();
    } catch (e) {
      // Ignore if service not loaded
    }

    // Clear account summary cache (since transactions affect it)
    try {
      const { clearAccountSummaryCache } = await import(
        "@/components/dashboard/DashboardAccountSummary"
      );
      clearAccountSummaryCache();
    } catch (e) {
      // Ignore if component not loaded
    }

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/transactions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete transaction");
    }

    // Clear frontend cache
    frontendCache.clearPattern("transactions");

    // Clear summary service cache (since transactions affect monthly/yearly summaries)
    try {
      const summaryService = await import("@/services/summaryService");
      summaryService.clearSummaryCache();
    } catch (e) {
      // Ignore if service not loaded
    }

    // Clear account summary cache (since transactions affect it)
    try {
      const { clearAccountSummaryCache } = await import(
        "@/components/dashboard/DashboardAccountSummary"
      );
      clearAccountSummaryCache();
    } catch (e) {
      // Ignore if component not loaded
    }

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();

    return true;
  } catch (error) {
    throw error;
  }
};

// Export the cache for external clearing if needed
export const transactionCache = {
  clear: () => frontendCache.clear(),
  clearPattern: (pattern: string) => frontendCache.clearPattern(pattern),
};
