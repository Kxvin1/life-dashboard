"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  Task,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
  RecurringFrequency,
  fetchTasks,
  fetchTaskCategories,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
  batchActionTasks,
  getRemainingAIUses,
  breakDownGoal,
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

  // AI state
  aiRemainingUses: number;
  aiTotalAllowed: number;
  isAILoading: boolean;
  aiError: string | null;

  // Task actions
  fetchAllTasks: () => Promise<void>;
  fetchTasksByType: (isLongTerm: boolean) => Promise<void>;
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

  // AI actions
  checkAIRemainingUses: () => Promise<void>;
  generateTasksFromGoal: (goalText: string) => Promise<Task[]>;
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
  const { isAuthenticated, isDemoUser } = useAuth();

  // Task state
  const [shortTermTasks, setShortTermTasks] = useState<Task[]>([]);
  const [longTermTasks, setLongTermTasks] = useState<Task[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalShortTermTasks, setTotalShortTermTasks] = useState(0);
  const [totalLongTermTasks, setTotalLongTermTasks] = useState(0);

  // AI state
  const [aiRemainingUses, setAIRemainingUses] = useState(0);
  const [aiTotalAllowed, setAITotalAllowed] = useState(0);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

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

  // Fetch tasks by type (short-term or long-term)
  const fetchTasksByType = useCallback(
    async (isLongTerm: boolean) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchTasks(isLongTerm);

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

        // Update the appropriate task list
        if (task.is_long_term) {
          setLongTermTasks((prev) => [newTask, ...prev]);
          setTotalLongTermTasks((prev) => prev + 1);
        } else {
          setShortTermTasks((prev) => [newTask, ...prev]);
          setTotalShortTermTasks((prev) => prev + 1);
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
    []
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

        // Find which list the task is in and update it
        const isInShortTerm = shortTermTasks.some((task) => task.id === taskId);
        const isInLongTerm = longTermTasks.some((task) => task.id === taskId);

        if (isInShortTerm) {
          // If task type changed, remove from short-term and add to long-term
          if (taskUpdate.is_long_term === true) {
            setShortTermTasks((prev) =>
              prev.filter((task) => task.id !== taskId)
            );
            setLongTermTasks((prev) => [updatedTask, ...prev]);
            setTotalShortTermTasks((prev) => prev - 1);
            setTotalLongTermTasks((prev) => prev + 1);
          } else {
            // Just update in the short-term list
            setShortTermTasks((prev) =>
              prev.map((task) => (task.id === taskId ? updatedTask : task))
            );
          }
        } else if (isInLongTerm) {
          // If task type changed, remove from long-term and add to short-term
          if (taskUpdate.is_long_term === false) {
            setLongTermTasks((prev) =>
              prev.filter((task) => task.id !== taskId)
            );
            setShortTermTasks((prev) => [updatedTask, ...prev]);
            setTotalLongTermTasks((prev) => prev - 1);
            setTotalShortTermTasks((prev) => prev + 1);
          } else {
            // Just update in the long-term list
            setLongTermTasks((prev) =>
              prev.map((task) => (task.id === taskId ? updatedTask : task))
            );
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
    [shortTermTasks, longTermTasks]
  );

  // Remove a task
  const removeTask = useCallback(
    async (taskId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        await deleteTask(taskId);

        // Remove from the appropriate task list
        const isInShortTerm = shortTermTasks.some((task) => task.id === taskId);

        if (isInShortTerm) {
          setShortTermTasks((prev) =>
            prev.filter((task) => task.id !== taskId)
          );
          setTotalShortTermTasks((prev) => prev - 1);
        } else {
          setLongTermTasks((prev) => prev.filter((task) => task.id !== taskId));
          setTotalLongTermTasks((prev) => prev - 1);
        }
      } catch (err) {
        console.error("Error removing task:", err);
        setError(err instanceof Error ? err.message : "Failed to remove task");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [shortTermTasks, longTermTasks]
  );

  // Change task status
  const changeTaskStatus = useCallback(
    async (taskId: number, status: TaskStatus) => {
      return await editTask(taskId, { status });
    },
    [editTask]
  );

  // Move task up in the list
  const moveTaskUp = useCallback(
    async (taskId: number, currentIndex: number, isLongTerm: boolean) => {
      console.log("moveTaskUp called with:", {
        taskId,
        currentIndex,
        isLongTerm,
      });

      if (currentIndex <= 0) {
        console.log("Task already at the top, not moving");
        return; // Already at the top
      }

      try {
        console.log("Calling reorderTask with:", {
          taskId,
          newPosition: currentIndex - 1,
        });
        await reorderTask(taskId, currentIndex - 1);
        console.log("reorderTask completed successfully");

        // Update the task list order
        if (isLongTerm) {
          console.log("Updating long term tasks");
          setLongTermTasks((prev) => {
            console.log("Previous long term tasks:", prev);
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex - 1, 0, task);
            console.log("New long term tasks:", newList);
            return newList;
          });
        } else {
          console.log("Updating short term tasks");
          setShortTermTasks((prev) => {
            console.log("Previous short term tasks:", prev);
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex - 1, 0, task);
            console.log("New short term tasks:", newList);
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
      console.log("moveTaskDown called with:", {
        taskId,
        currentIndex,
        isLongTerm,
      });

      const taskList = isLongTerm ? longTermTasks : shortTermTasks;
      if (currentIndex >= taskList.length - 1) {
        console.log("Task already at the bottom, not moving");
        return; // Already at the bottom
      }

      try {
        console.log("Calling reorderTask with:", {
          taskId,
          newPosition: currentIndex + 1,
        });
        await reorderTask(taskId, currentIndex + 1);
        console.log("reorderTask completed successfully");

        // Update the task list order
        if (isLongTerm) {
          console.log("Updating long term tasks");
          setLongTermTasks((prev) => {
            console.log("Previous long term tasks:", prev);
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex + 1, 0, task);
            console.log("New long term tasks:", newList);
            return newList;
          });
        } else {
          console.log("Updating short term tasks");
          setShortTermTasks((prev) => {
            console.log("Previous short term tasks:", prev);
            const newList = [...prev];
            const task = newList[currentIndex];
            newList.splice(currentIndex, 1);
            newList.splice(currentIndex + 1, 0, task);
            console.log("New short term tasks:", newList);
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
  const completeTasks = useCallback(async (taskIds: number[]) => {
    try {
      await batchActionTasks(taskIds, "complete");

      // Update both task lists
      setShortTermTasks((prev) =>
        prev.map((task) =>
          taskIds.includes(task.id)
            ? { ...task, status: TaskStatus.COMPLETED }
            : task
        )
      );

      setLongTermTasks((prev) =>
        prev.map((task) =>
          taskIds.includes(task.id)
            ? { ...task, status: TaskStatus.COMPLETED }
            : task
        )
      );
    } catch (err) {
      console.error("Error completing tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to complete tasks");
    }
  }, []);

  // Batch action: Delete multiple tasks
  const deleteTasks = useCallback(
    async (taskIds: number[]) => {
      try {
        await batchActionTasks(taskIds, "delete");

        // Remove from both task lists
        setShortTermTasks((prev) =>
          prev.filter((task) => !taskIds.includes(task.id))
        );
        setLongTermTasks((prev) =>
          prev.filter((task) => !taskIds.includes(task.id))
        );

        // Update counts
        const shortTermDeleted = shortTermTasks.filter((task) =>
          taskIds.includes(task.id)
        ).length;
        const longTermDeleted = longTermTasks.filter((task) =>
          taskIds.includes(task.id)
        ).length;

        setTotalShortTermTasks((prev) => prev - shortTermDeleted);
        setTotalLongTermTasks((prev) => prev - longTermDeleted);
      } catch (err) {
        console.error("Error deleting tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to delete tasks");
      }
    },
    [shortTermTasks, longTermTasks]
  );

  // Batch action: Change status of multiple tasks
  const changeTasksStatus = useCallback(
    async (taskIds: number[], status: TaskStatus) => {
      try {
        await batchActionTasks(taskIds, "change_status", status);

        // Update both task lists
        setShortTermTasks((prev) =>
          prev.map((task) =>
            taskIds.includes(task.id) ? { ...task, status } : task
          )
        );

        setLongTermTasks((prev) =>
          prev.map((task) =>
            taskIds.includes(task.id) ? { ...task, status } : task
          )
        );
      } catch (err) {
        console.error("Error changing tasks status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to change tasks status"
        );
      }
    },
    []
  );

  // Batch action: Change priority of multiple tasks
  const changeTasksPriority = useCallback(
    async (taskIds: number[], priority: TaskPriority) => {
      try {
        await batchActionTasks(taskIds, "change_priority", priority);

        // Update both task lists
        setShortTermTasks((prev) =>
          prev.map((task) =>
            taskIds.includes(task.id) ? { ...task, priority } : task
          )
        );

        setLongTermTasks((prev) =>
          prev.map((task) =>
            taskIds.includes(task.id) ? { ...task, priority } : task
          )
        );
      } catch (err) {
        console.error("Error changing tasks priority:", err);
        setError(
          err instanceof Error ? err.message : "Failed to change tasks priority"
        );
      }
    },
    []
  );

  // Check remaining AI uses
  const checkAIRemainingUses = useCallback(async () => {
    if (!isAuthenticated || isDemoUser) {
      setAIRemainingUses(0);
      setAITotalAllowed(0);
      return;
    }

    try {
      const response = await getRemainingAIUses();
      setAIRemainingUses(response.remaining_uses);
      setAITotalAllowed(response.total_uses_allowed);
    } catch (err) {
      console.error("Error checking AI remaining uses:", err);
      // Don't set error for this operation as it's not critical
      // Just set default values
      setAIRemainingUses(0);
      setAITotalAllowed(0);
    }
  }, [isAuthenticated, isDemoUser]);

  // Generate tasks from a goal using AI
  const generateTasksFromGoal = useCallback(
    async (goalText: string) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to use this feature");
      }

      if (isDemoUser) {
        throw new Error("AI features are not available in demo mode");
      }

      setIsAILoading(true);
      setAIError(null);

      try {
        const response = await breakDownGoal(goalText);

        // Update AI usage counts
        setAIRemainingUses(response.remaining_uses);
        setAITotalAllowed(response.total_uses_allowed);

        // Add the generated tasks to the appropriate lists
        const shortTerm = response.tasks.filter((task) => !task.is_long_term);
        const longTerm = response.tasks.filter((task) => task.is_long_term);

        if (shortTerm.length > 0) {
          setShortTermTasks((prev) => [...shortTerm, ...prev]);
          setTotalShortTermTasks((prev) => prev + shortTerm.length);
        }

        if (longTerm.length > 0) {
          setLongTermTasks((prev) => [...longTerm, ...prev]);
          setTotalLongTermTasks((prev) => prev + longTerm.length);
        }

        return response.tasks;
      } catch (err) {
        console.error("Error generating tasks from goal:", err);
        setAIError(
          err instanceof Error
            ? err.message
            : "Failed to generate tasks from goal"
        );
        throw err;
      } finally {
        setIsAILoading(false);
      }
    },
    [isAuthenticated, isDemoUser]
  );

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllTasks();
      // Only check AI remaining uses if not a demo user
      if (!isDemoUser) {
        try {
          checkAIRemainingUses();
        } catch (error) {
          console.error("Error checking AI remaining uses:", error);
          // Silently fail - this is not critical functionality
        }
      }
    }
  }, [isAuthenticated, isDemoUser, fetchAllTasks, checkAIRemainingUses]);

  const value = {
    // Task state
    shortTermTasks,
    longTermTasks,
    taskCategories,
    isLoading,
    error,
    totalShortTermTasks,
    totalLongTermTasks,

    // AI state
    aiRemainingUses,
    aiTotalAllowed,
    isAILoading,
    aiError,

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

    // AI actions
    checkAIRemainingUses,
    generateTasksFromGoal,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
