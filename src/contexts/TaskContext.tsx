"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  Task,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  fetchTasks,
  fetchTaskCategories,
  createTask,
  updateTask,
  deleteTask,
  batchActionTasks,
} from "@/services/taskService";

interface TaskContextType {
  // Task state
  shortTermTasks: Task[];
  longTermTasks: Task[];
  taskCategories: TaskCategory[];
  isLoading: boolean;
  error: string | null;
  totalShortTermTasks: number;
  totalLongTermTasks: number;

  // Pagination state
  tasksPerPage: number;

  // Task actions
  fetchAllTasks: () => Promise<void>;
  fetchTasksByType: (
    isLongTerm: boolean,
    page?: number,
    limit?: number
  ) => Promise<void>;
  addTask: (
    task: Omit<
      Task,
      "id" | "user_id" | "created_at" | "updated_at" | "category"
    >
  ) => Promise<Task>;
  editTask: (
    taskId: number,
    taskUpdate: Partial<
      Omit<Task, "id" | "user_id" | "created_at" | "updated_at" | "category">
    >
  ) => Promise<Task>;
  removeTask: (taskId: number) => Promise<void>;
  changeTaskStatus: (taskId: number, status: TaskStatus) => Promise<Task>;

  // Batch actions
  completeTasks: (taskIds: number[]) => Promise<void>;
  deleteTasks: (taskIds: number[]) => Promise<void>;
  changeTasksStatus: (taskIds: number[], status: TaskStatus) => Promise<void>;
  changeTasksPriority: (
    taskIds: number[],
    priority: TaskPriority
  ) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider = ({ children }: TaskProviderProps) => {
  const { isAuthenticated } = useAuth();

  // Task state
  const [shortTermTasks, setShortTermTasks] = useState<Task[]>([]);
  const [longTermTasks, setLongTermTasks] = useState<Task[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalShortTermTasks, setTotalShortTermTasks] = useState(0);
  const [totalLongTermTasks, setTotalLongTermTasks] = useState(0);

  // Fixed pagination limit of 10 items per page
  const tasksPerPage = 10;

  // Helper function to sort tasks by default order (due date first, then priority within same date)
  const sortTasksByDefault = useCallback((tasks: Task[]) => {
    return tasks.sort((a, b) => {
      // First: Sort by due date (closest first)
      if (a.due_date && b.due_date) {
        const dateComparison =
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (dateComparison !== 0) return dateComparison;

        // Same due date: Sort by priority (high to low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityComparison =
          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityComparison !== 0) return priorityComparison;

        // Same due date and priority: Sort by creation date (newest first)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (a.due_date && !b.due_date) {
        return -1; // Tasks with due dates come first
      } else if (!a.due_date && b.due_date) {
        return 1; // Tasks without due dates come last
      }

      // Both have no due date: Sort by priority, then creation date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityComparison =
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityComparison !== 0) return priorityComparison;

      // Finally by creation date (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, []);

  // Fetch task categories
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const categories = await fetchTaskCategories();
      setTaskCategories(categories);
    } catch (err) {
      console.error("Error fetching task categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch task categories"
      );
    }
  }, [isAuthenticated]);

  // Fetch tasks by type (short-term or long-term) with pagination
  const fetchTasksByType = useCallback(
    async (isLongTerm: boolean, page: number = 1, limit: number = 10) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch tasks with pagination parameters
        const response = await fetchTasks(
          isLongTerm,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          skip,
          limit
        );

        if (isLongTerm) {
          setLongTermTasks(response.tasks);
          setTotalLongTermTasks(response.total_count);
        } else {
          setShortTermTasks(response.tasks);
          setTotalShortTermTasks(response.total_count);
        }
      } catch (err) {
        console.error(
          `Error fetching ${isLongTerm ? "long-term" : "short-term"} tasks:`,
          err
        );
        setError(
          err instanceof Error
            ? err.message
            : `Failed to fetch ${isLongTerm ? "long-term" : "short-term"} tasks`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Fetch all tasks (both short-term and long-term)
  const fetchAllTasks = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch categories first
      await fetchCategories();

      // Fetch both types of tasks
      await Promise.all([
        fetchTasksByType(false), // Short-term tasks
        fetchTasksByType(true), // Long-term tasks
      ]);
    } catch (err) {
      console.error("Error fetching all tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchCategories, fetchTasksByType]);

  // Add a new task with optimistic update
  const addTask = useCallback(
    async (
      task: Omit<
        Task,
        "id" | "user_id" | "created_at" | "updated_at" | "category"
      >
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const newTask = await createTask(task);

        // Optimistic update: Add the new task to the appropriate list with smart sorting
        if (task.is_long_term) {
          setLongTermTasks((prev) => {
            const updated = [newTask, ...prev];
            return sortTasksByDefault(updated);
          });
        } else {
          setShortTermTasks((prev) => {
            const updated = [newTask, ...prev];
            return sortTasksByDefault(updated);
          });
        }

        return newTask;
      } catch (err) {
        console.error("Error adding task:", err);
        setError(err instanceof Error ? err.message : "Failed to add task");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [sortTasksByDefault]
  );

  // Edit an existing task with optimistic update
  const editTask = useCallback(
    async (
      taskId: number,
      taskUpdate: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at" | "category">
      >
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedTask = await updateTask(taskId, taskUpdate);

        // Find which list the task is in
        const isInShortTerm = shortTermTasks.some((task) => task.id === taskId);
        const isInLongTerm = longTermTasks.some((task) => task.id === taskId);

        // Handle task type changes (short-term <-> long-term)
        if (isInShortTerm && taskUpdate.is_long_term === true) {
          // Move from short-term to long-term
          setShortTermTasks((prev) =>
            prev.filter((task) => task.id !== taskId)
          );
          setLongTermTasks((prev) => {
            const updated = [updatedTask, ...prev];
            return sortTasksByDefault(updated);
          });
        } else if (isInLongTerm && taskUpdate.is_long_term === false) {
          // Move from long-term to short-term
          setLongTermTasks((prev) => prev.filter((task) => task.id !== taskId));
          setShortTermTasks((prev) => {
            const updated = [updatedTask, ...prev];
            return sortTasksByDefault(updated);
          });
        } else {
          // Update in the same list
          if (isInShortTerm) {
            setShortTermTasks((prev) => {
              const updated = prev.map((task) =>
                task.id === taskId ? updatedTask : task
              );
              return sortTasksByDefault(updated);
            });
          } else if (isInLongTerm) {
            setLongTermTasks((prev) => {
              const updated = prev.map((task) =>
                task.id === taskId ? updatedTask : task
              );
              return sortTasksByDefault(updated);
            });
          }
        }

        return updatedTask;
      } catch (err) {
        console.error("Error editing task:", err);
        setError(err instanceof Error ? err.message : "Failed to edit task");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [shortTermTasks, longTermTasks, sortTasksByDefault]
  );

  // Remove a task with optimistic update
  const removeTask = useCallback(async (taskId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteTask(taskId);

      // Optimistic update: Remove the task from the appropriate list
      setShortTermTasks((prev) => prev.filter((task) => task.id !== taskId));
      setLongTermTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Error removing task:", err);
      setError(err instanceof Error ? err.message : "Failed to remove task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change task status with optimistic update
  const changeTaskStatus = useCallback(
    async (taskId: number, status: TaskStatus) => {
      // Update local state immediately for both short-term and long-term tasks
      setShortTermTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task))
      );

      setLongTermTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task))
      );

      // Then call the API to persist the change
      try {
        return await editTask(taskId, { status });
      } catch (error) {
        console.error("Error changing task status:", error);

        // If API call fails, revert the local state
        setShortTermTasks((prev) => [...prev]);
        setLongTermTasks((prev) => [...prev]);

        throw error;
      }
    },
    [editTask]
  );

  // Batch action: Complete multiple tasks
  const completeTasks = useCallback(
    async (taskIds: number[]) => {
      try {
        await batchActionTasks(taskIds, "complete");

        // Refresh both task lists to ensure we have the latest data
        await Promise.all([
          fetchTasksByType(false), // Refresh short-term tasks
          fetchTasksByType(true), // Refresh long-term tasks
        ]);
      } catch (err) {
        console.error("Error completing tasks:", err);
        setError(
          err instanceof Error ? err.message : "Failed to complete tasks"
        );
      }
    },
    [fetchTasksByType]
  );

  // Batch action: Delete multiple tasks
  const deleteTasks = useCallback(
    async (taskIds: number[]) => {
      try {
        await batchActionTasks(taskIds, "delete");

        // Refresh both task lists to ensure we have the latest data
        await Promise.all([
          fetchTasksByType(false), // Refresh short-term tasks
          fetchTasksByType(true), // Refresh long-term tasks
        ]);
      } catch (err) {
        console.error("Error deleting tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to delete tasks");
      }
    },
    [fetchTasksByType]
  );

  // Batch action: Change status of multiple tasks
  const changeTasksStatus = useCallback(
    async (taskIds: number[], status: TaskStatus) => {
      try {
        await batchActionTasks(taskIds, "change_status", status);

        // Refresh both task lists to ensure we have the latest data
        await Promise.all([
          fetchTasksByType(false), // Refresh short-term tasks
          fetchTasksByType(true), // Refresh long-term tasks
        ]);
      } catch (err) {
        console.error("Error changing tasks status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to change tasks status"
        );
      }
    },
    [fetchTasksByType]
  );

  // Batch action: Change priority of multiple tasks
  const changeTasksPriority = useCallback(
    async (taskIds: number[], priority: TaskPriority) => {
      try {
        await batchActionTasks(taskIds, "change_priority", priority);

        // Refresh both task lists to ensure we have the latest data
        await Promise.all([
          fetchTasksByType(false), // Refresh short-term tasks
          fetchTasksByType(true), // Refresh long-term tasks
        ]);
      } catch (err) {
        console.error("Error changing tasks priority:", err);
        setError(
          err instanceof Error ? err.message : "Failed to change tasks priority"
        );
      }
    },
    [fetchTasksByType]
  );

  // We no longer automatically load tasks when the context is mounted
  // Instead, pages that need task data should explicitly call fetchAllTasks
  // This prevents unnecessary API calls on pages that don't need task data

  const value = {
    // Task state
    shortTermTasks,
    longTermTasks,
    taskCategories,
    isLoading,
    error,
    totalShortTermTasks,
    totalLongTermTasks,

    // Pagination state
    tasksPerPage,

    // Task actions
    fetchAllTasks,
    fetchTasksByType,
    addTask,
    editTask,
    removeTask,
    changeTaskStatus,

    // Batch actions
    completeTasks,
    deleteTasks,
    changeTasksStatus,
    changeTasksPriority,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
