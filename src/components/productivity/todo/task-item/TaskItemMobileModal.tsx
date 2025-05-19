"use client";

import { useEffect } from "react";
import {
  Task,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
} from "@/services/taskService";
import {
  formatTimeDuration,
  formatDaysDuration,
  minutesToDays,
} from "@/lib/utils";

interface TaskItemMobileModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const TaskItemMobileModal = ({
  task,
  isOpen,
  onClose,
  onEdit,
}: TaskItemMobileModalProps) => {
  if (!isOpen) return null;

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString()
    : "No due date";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:hidden">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md p-6 mx-auto overflow-auto bg-card rounded-xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Task Details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <h4 className="mb-1 text-sm font-medium text-foreground">
            {task.title}
          </h4>
          {task.description && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Description:
              </p>
              <p className="text-sm break-words whitespace-pre-wrap text-foreground">
                {task.description}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Status */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Status:</p>
            <p className="text-foreground">
              {task.status === TaskStatus.NOT_STARTED
                ? "Not Started"
                : task.status === TaskStatus.IN_PROGRESS
                ? "In Progress"
                : "Completed"}
            </p>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Priority:
            </p>
            <p className="text-foreground">
              {task.priority === TaskPriority.LOW
                ? "Low"
                : task.priority === TaskPriority.MEDIUM
                ? "Medium"
                : "High"}
            </p>
          </div>

          {/* Due date */}
          {task.due_date && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Due Date:
              </p>
              <p className="text-foreground">{formattedDueDate}</p>
            </div>
          )}

          {/* Time estimate */}
          {task.estimated_time_minutes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Time Estimate:
              </p>
              <p className="text-foreground">
                {task.is_long_term
                  ? formatDaysDuration(
                      minutesToDays(task.estimated_time_minutes)
                    )
                  : formatTimeDuration(task.estimated_time_minutes)}
              </p>
            </div>
          )}

          {/* Energy level */}
          {task.energy_level && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Energy Level:
              </p>
              <p className="text-foreground">
                {task.energy_level === EnergyLevel.LOW
                  ? "Low"
                  : task.energy_level === EnergyLevel.MEDIUM
                  ? "Medium"
                  : "High"}
              </p>
            </div>
          )}

          {/* Category */}
          {task.category && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Category:
              </p>
              <p className="text-foreground">{task.category.name}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="px-3 py-1 text-sm rounded-md bg-secondary text-foreground"
          >
            Edit Task
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItemMobileModal;
