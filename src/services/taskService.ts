import Cookies from "js-cookie";
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

// Request deduplication to prevent multiple simultaneous requests
const pendingRequests = new Map<string, Promise<any>>();

// Export function to clear task cache (for use by other services)
export const clearTaskCache = () => {
  frontendCache.clearPattern("tasks");
  frontendCache.clearPattern("task_categories");
  frontendCache.clearPattern("task_hierarchy");
  pendingRequests.clear();
};

export enum TaskStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum EnergyLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum RecurringFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

export interface TaskCategory {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  user_id?: number;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: TaskStatus;
  priority: TaskPriority;
  energy_level?: EnergyLevel;
  category_id?: number;
  category?: TaskCategory;
  estimated_time_minutes?: number;
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  parent_task_id?: number;
  is_long_term: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TaskWithChildren extends Task {
  child_tasks: TaskWithChildren[];
}

export interface TaskListResponse {
  tasks: Task[];
  total_count: number;
}

export const fetchTasks = async (
  isLongTerm?: boolean,
  status?: string,
  categoryId?: number,
  priority?: string,
  dueDateStart?: string,
  dueDateEnd?: string,
  skip: number = 0,
  limit: number = 100
): Promise<TaskListResponse> => {
  try {
    // Create cache key based on parameters
    const cacheKey = `tasks_${isLongTerm}_${status}_${categoryId}_${priority}_${dueDateStart}_${dueDateEnd}_${skip}_${limit}`;

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

    // Build query parameters
    const params = new URLSearchParams();
    if (isLongTerm !== undefined)
      params.append("is_long_term", String(isLongTerm));
    if (status) params.append("status", status);
    if (categoryId) params.append("category_id", String(categoryId));
    if (priority) params.append("priority", priority);
    if (dueDateStart) params.append("due_date_start", dueDateStart);
    if (dueDateEnd) params.append("due_date_end", dueDateEnd);
    params.append("skip", String(skip));
    params.append("limit", String(limit));

    // Create the request promise and store it
    const requestPromise = fetch(
      `${API_URL}/api/v1/tasks/?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch tasks");
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
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const fetchTaskHierarchy = async (
  isLongTerm?: boolean
): Promise<TaskWithChildren[]> => {
  try {
    // Create cache key based on parameters
    const cacheKey = `task_hierarchy_${isLongTerm}`;

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

    // Build query parameters
    const params = new URLSearchParams();
    if (isLongTerm !== undefined)
      params.append("is_long_term", String(isLongTerm));

    // Create the request promise and store it
    const requestPromise = fetch(
      `${API_URL}/api/v1/tasks/hierarchy?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch task hierarchy");
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
    console.error("Error fetching task hierarchy:", error);
    throw error;
  }
};

export const fetchTaskCategories = async (): Promise<TaskCategory[]> => {
  try {
    // Create cache key
    const cacheKey = `task_categories`;

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

    const url = `${API_URL}/api/v1/tasks/categories`;

    // Create the request promise and store it
    const requestPromise = fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "Failed to fetch task categories"
          );
        }

        const data = await response.json();

        // Cache the result for 24 hours (categories change rarely)
        frontendCache.set(cacheKey, data, 86400000); // 24 hours in ms

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
    console.error("Error fetching task categories:", error);
    throw error;
  }
};

export const createTaskCategory = async (
  name: string,
  description?: string
): Promise<TaskCategory> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description,
        is_default: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create task category");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating task category:", error);
    throw error;
  }
};

export const createTask = async (
  task: Omit<Task, "id" | "user_id" | "created_at" | "updated_at" | "category">
): Promise<Task> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create task");
    }

    // Clear frontend cache
    frontendCache.clearPattern("tasks");
    frontendCache.clearPattern("task_hierarchy");

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateTask = async (
  taskId: number,
  taskUpdate: Partial<
    Omit<Task, "id" | "user_id" | "created_at" | "updated_at" | "category">
  >
): Promise<Task> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskUpdate),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update task");
    }

    // Clear frontend cache
    frontendCache.clearPattern("tasks");
    frontendCache.clearPattern("task_hierarchy");

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete task");
    }

    // Clear frontend cache
    frontendCache.clearPattern("tasks");
    frontendCache.clearPattern("task_hierarchy");

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const batchActionTasks = async (
  taskIds: number[],
  action: string,
  value?: any
): Promise<void> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/tasks/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task_ids: taskIds,
        action,
        value,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to perform batch action");
    }

    // Clear frontend cache
    frontendCache.clearPattern("tasks");
    frontendCache.clearPattern("task_hierarchy");

    // Invalidate cache to force fresh data on next API calls
    cacheManager.invalidateCache();
  } catch (error) {
    console.error("Error performing batch action:", error);
    throw error;
  }
};
