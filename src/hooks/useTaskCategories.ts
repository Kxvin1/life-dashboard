"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TaskCategory, fetchTaskCategories } from "@/services/taskService";

/**
 * Custom hook for fetching and managing task categories
 * This hook is separate from the TaskContext to allow components to access
 * task categories without loading all task data
 */
export const useTaskCategories = () => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch task categories
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const categories = await fetchTaskCategories();
      setCategories(categories);
    } catch (err) {
      console.error("Error fetching task categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch task categories"
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load categories when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
  };
};
