"use client";

import { TaskStatus, TaskPriority } from "@/services/taskService";

// Helper function to get status badge color
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.NOT_STARTED:
      return "bg-secondary text-foreground";
    case TaskStatus.IN_PROGRESS:
      return "bg-blue-500 text-white";
    case TaskStatus.COMPLETED:
      return "bg-green-500 text-white";
    default:
      return "bg-secondary text-foreground";
  }
};

// Helper function to get status background color
export const getStatusBackgroundColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.NOT_STARTED:
      return "bg-card";
    case TaskStatus.IN_PROGRESS:
      return "bg-blue-50 dark:bg-blue-950/30";
    case TaskStatus.COMPLETED:
      return "bg-green-50 dark:bg-green-950/30";
    default:
      return "bg-card";
  }
};

// Helper function to get priority badge color
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case TaskPriority.MEDIUM:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case TaskPriority.HIGH:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-secondary text-foreground";
  }
};

// Format due date
export const formatDueDate = (dueDate: string | null): string => {
  return dueDate ? new Date(dueDate).toLocaleDateString() : "No due date";
};
