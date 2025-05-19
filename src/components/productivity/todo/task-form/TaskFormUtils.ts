"use client";

import {
  Task,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
  RecurringFrequency,
} from "@/services/taskService";
import { daysToMinutes, minutesToDays } from "@/lib/utils";

// Character limits
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 800;
export const MAX_TIME_MINUTES = 1440; // 24 hours (1 day)
export const MAX_TIME_DAYS = 365; // 1 year

// Form state interface
export interface TaskFormState {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  energyLevel?: EnergyLevel;
  categoryId?: number;
  estimatedTimeMinutes?: number;
  estimatedTimeDays?: number;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
}

// Create initial form state from task or defaults
export const createInitialFormState = (
  task?: Task,
  today: string = new Date().toISOString().split("T")[0]
): TaskFormState => {
  return {
    title: task?.title || "",
    description: task?.description || "",
    dueDate: task?.due_date || today,
    status: task?.status || TaskStatus.NOT_STARTED,
    priority: task?.priority || TaskPriority.MEDIUM,
    energyLevel: task?.energy_level,
    categoryId: task?.category_id,
    estimatedTimeMinutes: task?.estimated_time_minutes,
    estimatedTimeDays: task?.estimated_time_minutes
      ? minutesToDays(task.estimated_time_minutes)
      : undefined,
    isRecurring: task?.is_recurring || false,
    recurringFrequency: task?.recurring_frequency,
  };
};

// Check if form has unsaved changes
export const hasUnsavedChanges = (
  currentState: TaskFormState,
  initialState: TaskFormState,
  isDetailed: boolean
): boolean => {
  if (isDetailed) {
    return (
      currentState.title !== initialState.title ||
      currentState.description !== initialState.description ||
      currentState.dueDate !== initialState.dueDate ||
      currentState.status !== initialState.status ||
      currentState.priority !== initialState.priority ||
      currentState.energyLevel !== initialState.energyLevel ||
      currentState.categoryId !== initialState.categoryId ||
      currentState.estimatedTimeMinutes !== initialState.estimatedTimeMinutes ||
      currentState.isRecurring !== initialState.isRecurring ||
      currentState.recurringFrequency !== initialState.recurringFrequency
    );
  } else {
    // For quick add form, just check title
    return currentState.title.trim() !== "";
  }
};

// Validate form inputs
export const validateForm = (
  formState: TaskFormState,
  isLongTerm: boolean
): string | null => {
  // Validate title
  if (formState.title.length > MAX_TITLE_LENGTH) {
    return `Title cannot exceed ${MAX_TITLE_LENGTH} characters`;
  }

  // Validate description
  if (
    formState.description &&
    formState.description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`;
  }

  // Validate time estimate based on whether it's a long-term goal or short-term task
  if (isLongTerm) {
    if (
      formState.estimatedTimeDays &&
      (formState.estimatedTimeDays <= 0 ||
        formState.estimatedTimeDays > MAX_TIME_DAYS)
    ) {
      return `Time estimate must be between 1 and ${MAX_TIME_DAYS} days (1 year)`;
    }
  } else {
    if (
      formState.estimatedTimeMinutes &&
      (formState.estimatedTimeMinutes <= 0 ||
        formState.estimatedTimeMinutes > MAX_TIME_MINUTES)
    ) {
      return `Time estimate must be between 1 and ${MAX_TIME_MINUTES} minutes (1 day)`;
    }
  }

  return null;
};

// Prepare task data for submission
export const prepareTaskData = (
  formState: TaskFormState,
  isLongTerm: boolean
): Partial<Task> => {
  // For long-term goals, convert days to minutes for storage
  const finalEstimatedTimeMinutes = isLongTerm
    ? daysToMinutes(formState.estimatedTimeDays)
    : formState.estimatedTimeMinutes;

  return {
    title: formState.title,
    description: formState.description || undefined,
    due_date: formState.dueDate || undefined,
    status: formState.status,
    priority: formState.priority,
    energy_level: formState.energyLevel,
    category_id: formState.categoryId,
    estimated_time_minutes: finalEstimatedTimeMinutes,
    is_recurring: formState.isRecurring,
    recurring_frequency: formState.isRecurring
      ? formState.recurringFrequency
      : undefined,
    is_long_term: isLongTerm,
  };
};
