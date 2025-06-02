import Cookies from "js-cookie";
import { cacheManager } from "@/lib/cacheManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Frontend cache for Pomodoro data
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class FrontendCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 3600000; // 1 hour

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

// Request deduplication for Pomodoro API calls
const pendingRequests = new Map<string, Promise<any>>();

const dedupedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const key = `${url}_${JSON.stringify(options)}`;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const request = fetch(url, options).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    return response.json();
  });

  pendingRequests.set(key, request);

  try {
    const data = await request;
    return data;
  } finally {
    pendingRequests.delete(key);
  }
};

export interface PomodoroSession {
  id: number;
  user_id: number;
  task_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "completed" | "interrupted";
  notes?: string;
  created_at: string;
}

export interface PomodoroSessionsResponse {
  items: PomodoroSession[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
  streak_count: number;
}

export interface PomodoroAIResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  charts: {
    daily_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    completion_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    time_of_day_chart: {
      labels: number[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
  };
  remaining_uses: number;
  total_uses_allowed: number;
  history_id?: number;
}

export interface PomodoroAIHistoryItem {
  id: number;
  user_id: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  charts_data: {
    daily_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    completion_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    time_of_day_chart: {
      labels: number[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
  };
  created_at: string;
}

export interface PomodoroAIRemainingResponse {
  remaining_uses: number;
  total_uses_allowed: number;
  reset_time: string;
}

export interface PomodoroCountsResponse {
  today: number;
  week: number;
  total: number;
}

export interface PomodoroStreakResponse {
  streak_count: number;
  has_completed_today: boolean;
}

export const createPomodoroSession = async (sessionData: {
  task_name: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  status: "completed" | "interrupted";
  notes?: string;
}): Promise<PomodoroSession> => {
  try {
    const token = Cookies.get("token");

    const response = await fetch(`${API_URL}/api/v1/pomodoro/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create Pomodoro session");
    }

    const data = await response.json();

    // Clear frontend cache after creating session
    frontendCache.clearPattern("pomodoro");

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();

    return data;
  } catch (error) {
    console.error("Error creating Pomodoro session:", error);
    throw error;
  }
};

export const getPomodoroSessions = async (
  page: number = 1,
  limit: number = 10
): Promise<PomodoroSessionsResponse> => {
  try {
    const token = Cookies.get("token");
    const skip = (page - 1) * limit;
    const cacheBust = cacheManager.getCacheBustParam();

    // Create cache key
    const cacheKey = `pomodoro_sessions_${page}_${limit}`;

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const url = `${API_URL}/api/v1/pomodoro/sessions?skip=${skip}&limit=${limit}${cacheBust}`;

    const data = await dedupedFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    // Cache for 1 hour
    frontendCache.set(cacheKey, data, 3600000);

    return data;
  } catch (error) {
    console.error("Error fetching Pomodoro sessions:", error);
    throw error;
  }
};

export const analyzePomodoroSessions =
  async (): Promise<PomodoroAIResponse> => {
    try {
      const token = Cookies.get("token");

      const response = await fetch(`${API_URL}/api/v1/pomodoro/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to analyze Pomodoro sessions"
        );
      }

      const data = await response.json();

      // Clear AI-related cache after analysis (affects remaining uses)
      frontendCache.clearPattern("pomodoro_ai");

      // Invalidate cache to force fresh data on next API calls
      cacheManager.invalidateCache();

      return data;
    } catch (error) {
      console.error("Error analyzing Pomodoro sessions:", error);
      throw error;
    }
  };

export const getRemainingPomodoroAIUses =
  async (): Promise<PomodoroAIRemainingResponse> => {
    try {
      const token = Cookies.get("token");
      const cacheBust = cacheManager.getCacheBustParam();

      // Create cache key
      const cacheKey = "pomodoro_ai_remaining";

      // Check frontend cache first
      const cachedData = frontendCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const url = `${API_URL}/api/v1/pomodoro/remaining${cacheManager.getCacheBustParamFirst()}${cacheBust}`;

      const data = await dedupedFetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Encoding": "gzip, deflate, br",
        },
      });

      // Cache for 10 minutes (AI usage changes frequently)
      frontendCache.set(cacheKey, data, 600000);

      return data;
    } catch (error) {
      console.error("Error fetching remaining AI uses:", error);
      throw error;
    }
  };

export const getPomodoroAIHistory = async (
  skip: number = 0,
  limit: number = 10
): Promise<PomodoroAIHistoryItem[]> => {
  try {
    const token = Cookies.get("token");
    const cacheBust = cacheManager.getCacheBustParam();

    // Create cache key
    const cacheKey = `pomodoro_ai_history_${skip}_${limit}`;

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const url = `${API_URL}/api/v1/pomodoro/history?skip=${skip}&limit=${limit}${cacheBust}`;

    const data = await dedupedFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    // Cache for 1 hour (AI history doesn't change often)
    frontendCache.set(cacheKey, data, 3600000);

    return data;
  } catch (error) {
    console.error("Error getting Pomodoro AI history:", error);
    throw error;
  }
};

export const getPomodoroAIHistoryById = async (
  id: number
): Promise<PomodoroAIHistoryItem> => {
  try {
    const token = Cookies.get("token");
    const cacheBust = cacheManager.getCacheBustParam();

    // Create cache key
    const cacheKey = `pomodoro_ai_history_item_${id}`;

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const url = `${API_URL}/api/v1/pomodoro/history/${id}${cacheManager.getCacheBustParamFirst()}${cacheBust}`;

    const data = await dedupedFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    // Cache for 1 hour (individual AI history items don't change)
    frontendCache.set(cacheKey, data, 3600000);

    return data;
  } catch (error) {
    console.error("Error getting Pomodoro AI history item:", error);
    throw error;
  }
};

export const getPomodoroCounts = async (): Promise<PomodoroCountsResponse> => {
  try {
    const token = Cookies.get("token");
    const cacheBust = cacheManager.getCacheBustParam();

    // Create cache key
    const cacheKey = "pomodoro_counts";

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const url = `${API_URL}/api/v1/pomodoro/counts${cacheManager.getCacheBustParamFirst()}${cacheBust}`;

    const data = await dedupedFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    // Cache for 30 minutes (counts change frequently)
    frontendCache.set(cacheKey, data, 1800000);

    return data;
  } catch (error) {
    console.error("Error getting Pomodoro counts:", error);
    // Return default values if there's an error
    return { today: 0, week: 0, total: 0 };
  }
};

export const getPomodoroStreak = async (): Promise<PomodoroStreakResponse> => {
  try {
    const token = Cookies.get("token");
    const cacheBust = cacheManager.getCacheBustParam();

    // Create cache key
    const cacheKey = "pomodoro_streak";

    // Check frontend cache first
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const url = `${API_URL}/api/v1/pomodoro/streak${cacheManager.getCacheBustParamFirst()}${cacheBust}`;

    const data = await dedupedFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    // Cache for 10 minutes (streak data changes when sessions are completed)
    frontendCache.set(cacheKey, data, 600000);

    return data;
  } catch (error) {
    console.error("Error getting Pomodoro streak:", error);
    // Return default values if there's an error
    return { streak_count: 0, has_completed_today: false };
  }
};
