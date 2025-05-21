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
  reorderTask,
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
  moveTaskUp: (
    taskId: number,
    currentIndex: number,
    isLongTerm: boolean
  ) => Promise<void>;
  moveTaskDown: (
    taskId: number,
    currentIndex: number,
    isLongTerm: boolean
  ) => Promise<void>;

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

  // Add a new task
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

        // Refresh the task list completely to ensure we have the latest data
        await fetchTasksByType(task.is_long_term);

        return newTask;
      } catch (err) {
        console.error("Error adding task:", err);
        setError(err instanceof Error ? err.message : "Failed to add task");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTasksByType]
  );

  // Edit an existing task
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

        // Refresh the appropriate task list to ensure we have the latest data
        if (isInShortTerm && taskUpdate.is_long_term === true) {
          // If task moved from short-term to long-term, refresh both lists
          await Promise.all([
            fetchTasksByType(false), // Refresh short-term tasks
            fetchTasksByType(true), // Refresh long-term tasks
          ]);
        } else if (isInLongTerm && taskUpdate.is_long_term === false) {
          // If task moved from long-term to short-term, refresh both lists
          await Promise.all([
            fetchTasksByType(false), // Refresh short-term tasks
            fetchTasksByType(true), // Refresh long-term tasks
          ]);
        } else if (isInShortTerm) {
          // Just refresh short-term list
          await fetchTasksByType(false);
        } else if (isInLongTerm) {
          // Just refresh long-term list
          await fetchTasksByType(true);
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
    [shortTermTasks, longTermTasks, fetchTasksByType]
  );

  // Remove a task
  const removeTask = useCallback(
    async (taskId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        await deleteTask(taskId);

        // Find which list the task is in
        const isInShortTerm = shortTermTasks.some((task) => task.id === taskId);

        // Refresh the appropriate task list
        if (isInShortTerm) {
          await fetchTasksByType(false); // Refresh short-term tasks
        } else {
          await fetchTasksByType(true); // Refresh long-term tasks
        }
      } catch (err) {
        console.error("Error removing task:", err);
        setError(err instanceof Error ? err.message : "Failed to remove task");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [shortTermTasks, longTermTasks, fetchTasksByType]
  );

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

  // Move task up in the list
  const moveTaskUp = useCallback(
    async (taskId: number, currentIndex: number, isLongTerm: boolean) => {
      if (currentIndex <= 0) {
        return; // Already at the top
      }

      try {
        await reorderTask(taskId, currentIndex - 1);

        // Update the task list order
        if (isLongTerm) {
          setLongTermTasks((prev) => {
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex - 1, 0, task);
            return newList;
          });
        } else {
          setShortTermTasks((prev) => {
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex - 1, 0, task);
            return newList;
          });
        }
      } catch (err) {
        console.error("Error moving task up:", err);
        setError(err instanceof Error ? err.message : "Failed to move task up");
      }
    },
    [reorderTask, setError, setLongTermTasks, setShortTermTasks]
  );

  // Move task down in the list
  const moveTaskDown = useCallback(
    async (taskId: number, currentIndex: number, isLongTerm: boolean) => {
      const taskList = isLongTerm ? longTermTasks : shortTermTasks;
      if (currentIndex >= taskList.length - 1) {
        return; // Already at the bottom
      }

      try {
        await reorderTask(taskId, currentIndex + 1);

        // Update the task list order
        if (isLongTerm) {
          setLongTermTasks((prev) => {
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex + 1, 0, task);
            return newList;
          });
        } else {
          setShortTermTasks((prev) => {
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex + 1, 0, task);
            return newList;
          });
        }
      } catch (err) {
        console.error("Error moving task down:", err);
        setError(
          err instanceof Error ? err.message : "Failed to move task down"
        );
      }
    },
    [
      longTermTasks,
      shortTermTasks,
      reorderTask,
      setError,
      setLongTermTasks,
      setShortTermTasks,
    ]
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
    moveTaskUp,
    moveTaskDown,

    // Batch actions
    completeTasks,
    deleteTasks,
    changeTasksStatus,
    changeTasksPriority,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
