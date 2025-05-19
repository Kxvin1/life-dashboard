"use client";

import { useState, useEffect, useRef } from "react";
import { useTask } from "@/contexts/TaskContext";
import {
  Task,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
  RecurringFrequency,
} from "@/services/taskService";
import {
  formatTimeDuration,
  formatDaysDuration,
  daysToMinutes,
  minutesToDays,
} from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface TaskFormProps {
  isLongTerm: boolean;
  task?: Task; // If provided, we're editing an existing task
  onClose: () => void;
}

const TaskForm = ({ isLongTerm, task, onClose }: TaskFormProps) => {
  const { taskCategories, addTask, editTask } = useTask();
  const [isDetailed, setIsDetailed] = useState(!!task); // Show detailed form if editing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Character limits
  const MAX_TITLE_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 800;
  const MAX_TIME_MINUTES = 1440; // 24 hours (1 day)
  const MAX_TIME_DAYS = 365; // 1 year

  // For long-term goals, we'll use days instead of minutes
  const [estimatedTimeDays, setEstimatedTimeDays] = useState<
    number | undefined
  >(
    task?.estimated_time_minutes
      ? minutesToDays(task.estimated_time_minutes)
      : undefined
  );

  // Form state
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  // Default due date to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(task?.due_date || today);
  const [status, setStatus] = useState<TaskStatus>(
    task?.status || TaskStatus.NOT_STARTED
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority || TaskPriority.MEDIUM
  );
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | undefined>(
    task?.energy_level
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(
    task?.category_id
  );
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState<
    number | undefined
  >(task?.estimated_time_minutes);
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    RecurringFrequency | undefined
  >(task?.recurring_frequency);

  // Track initial form state to detect changes
  const initialFormState = useRef({
    title: task?.title || "",
    description: task?.description || "",
    dueDate: task?.due_date || "",
    status: task?.status || TaskStatus.NOT_STARTED,
    priority: task?.priority || TaskPriority.MEDIUM,
    energyLevel: task?.energy_level,
    categoryId: task?.category_id,
    estimatedTimeMinutes: task?.estimated_time_minutes,
    isRecurring: task?.is_recurring || false,
    recurringFrequency: task?.recurring_frequency,
  });

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (isDetailed) {
      return (
        title !== initialFormState.current.title ||
        description !== initialFormState.current.description ||
        dueDate !== initialFormState.current.dueDate ||
        status !== initialFormState.current.status ||
        priority !== initialFormState.current.priority ||
        energyLevel !== initialFormState.current.energyLevel ||
        categoryId !== initialFormState.current.categoryId ||
        estimatedTimeMinutes !==
          initialFormState.current.estimatedTimeMinutes ||
        isRecurring !== initialFormState.current.isRecurring ||
        recurringFrequency !== initialFormState.current.recurringFrequency
      );
    } else {
      // For quick add form, just check title
      return title.trim() !== "";
    }
  };

  // Handle close attempt
  const handleCloseAttempt = () => {
    if (hasUnsavedChanges()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseAttempt();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [
    title,
    description,
    dueDate,
    status,
    priority,
    energyLevel,
    categoryId,
    estimatedTimeMinutes,
    isRecurring,
    recurringFrequency,
  ]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate inputs
    if (title.length > MAX_TITLE_LENGTH) {
      setError(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
      setIsSubmitting(false);
      return;
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      setError(
        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`
      );
      setIsSubmitting(false);
      return;
    }

    // Validate time estimate based on whether it's a long-term goal or short-term task
    if (isLongTerm) {
      if (
        estimatedTimeDays &&
        (estimatedTimeDays <= 0 || estimatedTimeDays > MAX_TIME_DAYS)
      ) {
        setError(
          `Time estimate must be between 1 and ${MAX_TIME_DAYS} days (1 year)`
        );
        setIsSubmitting(false);
        return;
      }
    } else {
      if (
        estimatedTimeMinutes &&
        (estimatedTimeMinutes <= 0 || estimatedTimeMinutes > MAX_TIME_MINUTES)
      ) {
        setError(
          `Time estimate must be between 1 and ${MAX_TIME_MINUTES} minutes (1 day)`
        );
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Prepare task data
      // For long-term goals, convert days to minutes for storage
      const finalEstimatedTimeMinutes = isLongTerm
        ? daysToMinutes(estimatedTimeDays)
        : estimatedTimeMinutes;

      const taskData = {
        title,
        description: description || undefined,
        due_date: dueDate || undefined,
        status,
        priority,
        energy_level: energyLevel,
        category_id: categoryId,
        estimated_time_minutes: finalEstimatedTimeMinutes,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : undefined,
        is_long_term: isLongTerm,
      };

      if (task) {
        // Editing existing task
        await editTask(task.id, taskData);
      } else {
        // Creating new task
        await addTask(taskData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick add form (just title)
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    // Validate title length
    if (title.length > MAX_TITLE_LENGTH) {
      setError(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
      setIsSubmitting(false);
      return;
    }

    try {
      await addTask({
        title,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        is_recurring: false,
        is_long_term: isLongTerm,
        due_date: dueDate, // Include today's date by default
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 mb-4 border rounded-lg bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">
          {task ? "Edit" : "Add"} {isLongTerm ? "Long-Term Task" : "Task"}
        </h3>
        {!task && (
          <button
            type="button"
            className="text-sm text-primary"
            onClick={() => setIsDetailed(!isDetailed)}
          >
            {isDetailed ? "Simple Form" : "Detailed Form"}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {isDetailed ? (
        // Detailed form
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-foreground"
              >
                Title *
              </label>
              <span className="text-xs text-muted-foreground">
                {title.length}/{MAX_TITLE_LENGTH} characters
              </span>
            </div>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TITLE_LENGTH) {
                  setTitle(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              maxLength={MAX_TITLE_LENGTH}
              required
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-foreground"
              >
                Description
              </label>
              <span className="text-xs text-muted-foreground">
                {description.length}/{MAX_DESCRIPTION_LENGTH} characters
              </span>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                  setDescription(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground min-h-[100px] resize-y"
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
          </div>

          {/* Two columns for smaller fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Due Date */}
            <div>
              <label
                htmlFor="dueDate"
                className="block mb-1 text-sm font-medium text-foreground"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block mb-1 text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              >
                <option value={TaskStatus.NOT_STARTED}>Not Started</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block mb-1 text-sm font-medium text-foreground"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
            </div>

            {/* Energy Level */}
            <div>
              <label
                htmlFor="energyLevel"
                className="block mb-1 text-sm font-medium text-foreground"
              >
                Energy Level
              </label>
              <select
                id="energyLevel"
                value={energyLevel || ""}
                onChange={(e) =>
                  setEnergyLevel(
                    e.target.value ? (e.target.value as EnergyLevel) : undefined
                  )
                }
                className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              >
                <option value="">Not Specified</option>
                <option value={EnergyLevel.LOW}>Low</option>
                <option value={EnergyLevel.MEDIUM}>Medium</option>
                <option value={EnergyLevel.HIGH}>High</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block mb-1 text-sm font-medium text-foreground"
              >
                Category
              </label>
              <select
                id="category"
                value={categoryId || ""}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              >
                <option value="">Not Categorized</option>
                {taskCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="estimatedTime"
                  className="block text-sm font-medium text-foreground"
                >
                  {isLongTerm
                    ? "Estimated Time (days)"
                    : "Estimated Time (minutes)"}
                </label>
                {isLongTerm
                  ? estimatedTimeDays && (
                      <span className="text-xs text-muted-foreground">
                        {formatDaysDuration(estimatedTimeDays)}
                      </span>
                    )
                  : estimatedTimeMinutes && (
                      <span className="text-xs text-muted-foreground">
                        {formatTimeDuration(estimatedTimeMinutes)}
                      </span>
                    )}
              </div>
              {isLongTerm ? (
                <input
                  type="number"
                  id="estimatedTime"
                  value={estimatedTimeDays || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value)
                      : undefined;
                    if (!value || (value > 0 && value <= MAX_TIME_DAYS)) {
                      setEstimatedTimeDays(value);
                    }
                  }}
                  min="1"
                  max={MAX_TIME_DAYS}
                  className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
                  placeholder={`Max: ${MAX_TIME_DAYS} days (1 year)`}
                />
              ) : (
                <input
                  type="number"
                  id="estimatedTime"
                  value={estimatedTimeMinutes || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value)
                      : undefined;
                    if (!value || (value > 0 && value <= MAX_TIME_MINUTES)) {
                      setEstimatedTimeMinutes(value);
                    }
                  }}
                  min="1"
                  max={MAX_TIME_MINUTES}
                  className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
                  placeholder={`Max: ${MAX_TIME_MINUTES} minutes (1 day)`}
                />
              )}
            </div>
          </div>

          {/* Recurring Task */}
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 mr-2 border-gray-300 rounded text-primary focus:ring-primary"
              />
              <label
                htmlFor="isRecurring"
                className="text-sm font-medium text-foreground"
                title="Mark a task as recurring to indicate it should be repeated regularly. Note: Currently, you'll need to manually create new instances of recurring tasks after completion."
              >
                Recurring Task
                <span className="ml-1 text-xs text-muted-foreground">
                  (Manual)
                </span>
              </label>
            </div>

            {isRecurring && (
              <select
                id="recurringFrequency"
                value={recurringFrequency || ""}
                onChange={(e) =>
                  setRecurringFrequency(
                    e.target.value
                      ? (e.target.value as RecurringFrequency)
                      : undefined
                  )
                }
                className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
              >
                <option value="">Select Frequency</option>
                <option value={RecurringFrequency.DAILY}>Daily</option>
                <option value={RecurringFrequency.WEEKLY}>Weekly</option>
                <option value={RecurringFrequency.MONTHLY}>Monthly</option>
                <option value={RecurringFrequency.CUSTOM}>Custom</option>
              </select>
            )}
          </div>

          {/* Form actions */}
          <div className="flex justify-end pt-2 space-x-2">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="px-4 py-2 rounded-md bg-secondary text-foreground"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="w-4 h-4 mr-2 border-2 rounded-full border-primary-foreground animate-spin border-t-transparent"></span>
              )}
              {task ? "Update" : "Create"}
            </button>
          </div>
        </form>
      ) : (
        // Quick add form
        <form onSubmit={handleQuickAdd} className="flex flex-col space-y-2">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="quickTitle"
              className="block text-sm font-medium text-foreground"
            >
              {isLongTerm ? "Goal" : "Task"} Title
            </label>
            <span className="text-xs text-muted-foreground">
              {title.length}/{MAX_TITLE_LENGTH} characters
            </span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              id="quickTitle"
              value={title}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TITLE_LENGTH) {
                  setTitle(e.target.value);
                }
              }}
              placeholder={`Enter ${
                isLongTerm ? "long-term task" : "task"
              } title`}
              className="flex-1 px-3 py-2 border rounded-md bg-background border-border text-foreground"
              maxLength={MAX_TITLE_LENGTH}
              required
            />
            <button
              type="submit"
              className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="w-4 h-4 mr-2 border-2 rounded-full border-primary-foreground animate-spin border-t-transparent"></span>
              )}
              Add
            </button>
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="px-4 py-2 rounded-md bg-secondary text-foreground"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Dialog for Unsaved Changes */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to close this form? Your changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Continue Editing"
        onConfirm={onClose}
        onCancel={() => setShowCloseConfirm(false)}
        variant="warning"
      />
    </div>
  );
};

export default TaskForm;
