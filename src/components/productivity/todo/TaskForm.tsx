"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTask } from "@/contexts/TaskContext";
import { Task } from "@/services/taskService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  TaskFormHeader,
  DetailedTaskForm,
  QuickAddTaskForm,
  TaskFormState,
  createInitialFormState,
  hasUnsavedChanges,
  validateForm,
  prepareTaskData,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TIME_MINUTES,
  MAX_TIME_DAYS,
} from "./task-form";

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

  // Default due date to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Form state
  const [formState, setFormState] = useState<TaskFormState>(
    createInitialFormState(task, today)
  );

  // Track initial form state to detect changes
  const initialFormState = useRef(createInitialFormState(task, today));

  // Update form state
  const updateFormState = (updates: Partial<TaskFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  // Handle close attempt
  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges(formState, initialFormState.current, isDetailed)) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [formState, initialFormState, isDetailed, onClose]);

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
  }, [formState, handleCloseAttempt]);

  // Handle detailed form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate inputs
    const validationError = validateForm(formState, isLongTerm);
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare task data
      const taskData = prepareTaskData(formState, isLongTerm);

      if (task) {
        // Editing existing task
        await editTask(task.id, taskData);
      } else {
        // Creating new task
        // Ensure required fields are not undefined for addTask
        await addTask({
          title: formState.title,
          description: formState.description || undefined,
          due_date: formState.dueDate || undefined,
          status: formState.status,
          priority: formState.priority,
          energy_level: formState.energyLevel,
          category_id: formState.categoryId,
          estimated_time_minutes:
            isLongTerm && formState.estimatedTimeDays
              ? formState.estimatedTimeDays * 24 * 60 // Convert days to minutes
              : formState.estimatedTimeMinutes,
          is_recurring: formState.isRecurring,
          recurring_frequency: formState.isRecurring
            ? formState.recurringFrequency
            : undefined,
          is_long_term: isLongTerm,
        });
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
    if (!formState.title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    // Validate title length
    if (formState.title.length > MAX_TITLE_LENGTH) {
      setError(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
      setIsSubmitting(false);
      return;
    }

    try {
      await addTask({
        title: formState.title,
        status: formState.status,
        priority: formState.priority,
        is_recurring: false,
        is_long_term: isLongTerm,
        due_date: formState.dueDate, // Include today's date by default
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
      <TaskFormHeader
        isLongTerm={isLongTerm}
        isEditing={!!task}
        isDetailed={isDetailed}
        setIsDetailed={setIsDetailed}
        error={error}
      />

      {isDetailed ? (
        <DetailedTaskForm
          isLongTerm={isLongTerm}
          isEditing={!!task}
          isSubmitting={isSubmitting}
          formState={formState}
          setFormState={updateFormState}
          taskCategories={taskCategories}
          onSubmit={handleSubmit}
          onCancel={handleCloseAttempt}
          maxTitleLength={MAX_TITLE_LENGTH}
          maxDescriptionLength={MAX_DESCRIPTION_LENGTH}
          maxTimeMinutes={MAX_TIME_MINUTES}
          maxTimeDays={MAX_TIME_DAYS}
        />
      ) : (
        <QuickAddTaskForm
          isLongTerm={isLongTerm}
          title={formState.title}
          setTitle={(title) => updateFormState({ title })}
          isSubmitting={isSubmitting}
          onSubmit={handleQuickAdd}
          onCancel={handleCloseAttempt}
          maxTitleLength={MAX_TITLE_LENGTH}
        />
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
