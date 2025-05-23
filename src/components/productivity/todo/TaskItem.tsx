"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTask } from "@/contexts/TaskContext";
import { Task, TaskStatus } from "@/services/taskService";
import TaskForm from "./TaskForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { truncateText } from "@/lib/utils";
import {
  // Helper functions
  getStatusBackgroundColor,

  // Badge components
  StatusBadge,
  PriorityBadge,
  CategoryBadge,
  TimeBadge,
  EnergyBadge,
  DueDateBadge,

  // Action components
  EditDeleteActions,
  StatusToggleButton,

  // Detail components
  TaskItemDetails,
  TaskItemMobileModal,
} from "./task-item";

interface TaskItemProps {
  task: Task;
  index: number;
  isSelected: boolean;
  onSelect: (taskId: number) => void;

  updateTaskStatus?: (taskId: number, newStatus: TaskStatus) => void;
}

const TaskItem = ({
  task,
  index,
  isSelected,
  onSelect,
  updateTaskStatus,
}: TaskItemProps) => {
  const { removeTask, changeTaskStatus } = useTask();
  const [showDetails, setShowDetails] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add slide-up animation style once
  useEffect(() => {
    if (!document.getElementById("task-slide-animation")) {
      const style = document.createElement("style");
      style.id = "task-slide-animation";
      style.textContent = `
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation-name: slide-up;
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Local state for task status to enable truly optimistic UI updates
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status);
  // Track if a status change is in progress to prevent multiple calls
  const [isStatusChangeInProgress, setIsStatusChangeInProgress] =
    useState(false);
  // Use a ref to store the latest task status for comparison
  const latestTaskStatus = useRef(task.status);
  // Use a ref to store timeouts for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local status when task prop changes, but only if not in the middle of a change
  useEffect(() => {
    if (!isStatusChangeInProgress) {
      setLocalStatus(task.status);
    }
    latestTaskStatus.current = task.status;
  }, [task.status, isStatusChangeInProgress]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Custom function to update status without triggering a refresh
  const updateStatusWithoutRefresh = useCallback(
    (newStatus: TaskStatus) => {
      // Prevent multiple rapid changes
      if (isStatusChangeInProgress) return;

      // Set flag to indicate a status change is in progress
      setIsStatusChangeInProgress(true);

      // Update local state immediately for responsive UI
      setLocalStatus(newStatus);

      // Also update the parent component's state if available
      if (updateTaskStatus) {
        updateTaskStatus(task.id, newStatus);
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Delay the API call to ensure UI updates first
      timeoutRef.current = setTimeout(() => {
        // Use a direct fetch call instead of the context function
        const token =
          localStorage.getItem("token") ||
          document.cookie.replace(
            /(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/,
            "$1"
          );
        if (!token) {
          // Try to use the context function as fallback
          try {
            changeTaskStatus(task.id, newStatus);
          } catch (error) {
            console.error("Error updating task status:", error);
          }
          setIsStatusChangeInProgress(false);
          return;
        }

        const apiUrl = `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/v1/tasks/${task.id}`;

        fetch(apiUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to update task status");
            }
            return response.json();
          })
          .catch((error) => {
            console.error("Error updating task status:", error);
            // If API call fails, revert the local state
            setLocalStatus(latestTaskStatus.current);
          })
          .finally(() => {
            setIsStatusChangeInProgress(false);
            timeoutRef.current = null;
          });
      }, 500); // 500ms delay
    },
    [task.id, updateTaskStatus, isStatusChangeInProgress]
  );

  // Toggle task completion status with optimistic update
  const handleToggleCompletion = useCallback(() => {
    const newStatus =
      localStatus === TaskStatus.COMPLETED
        ? TaskStatus.NOT_STARTED
        : TaskStatus.COMPLETED;

    updateStatusWithoutRefresh(newStatus);
  }, [localStatus, updateStatusWithoutRefresh]);

  // Cycle status with optimistic update: Not Started → In Progress → Completed → Not Started
  const handleStatusChange = useCallback(() => {
    let newStatus: TaskStatus;
    switch (localStatus) {
      case TaskStatus.NOT_STARTED:
        newStatus = TaskStatus.IN_PROGRESS;
        break;
      case TaskStatus.IN_PROGRESS:
        newStatus = TaskStatus.COMPLETED;
        break;
      case TaskStatus.COMPLETED:
        newStatus = TaskStatus.NOT_STARTED;
        break;
      default:
        newStatus = TaskStatus.NOT_STARTED;
    }

    updateStatusWithoutRefresh(newStatus);
  }, [localStatus, updateStatusWithoutRefresh]);

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleConfirmDelete = async () => {
    try {
      await removeTask(task.id);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Render form or card
  const taskContent = showEditForm ? (
    <TaskForm
      isLongTerm={task.is_long_term}
      task={task}
      onClose={() => setShowEditForm(false)}
    />
  ) : (
    <div
      className={`${getStatusBackgroundColor(localStatus)} border ${
        isSelected ? "border-primary border-2" : "border-border"
      } rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md relative cursor-pointer ${
        isSelected ? "shadow-md shadow-primary/10" : ""
      }`}
      onClick={(e) => {
        // Only select if clicking on the card itself, not on interactive elements
        if (
          e.target === e.currentTarget ||
          (e.currentTarget.contains(e.target as Node) &&
            !(e.target as HTMLElement).closest("button") &&
            !(e.target as HTMLElement).closest("a") &&
            !(e.target as HTMLElement).closest('[role="button"]') &&
            !(e.target as HTMLElement).closest('[data-interactive="true"]'))
        ) {
          onSelect(task.id);
        }
      }}
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row">
          <div className="flex items-start flex-1">
            {/* Task order */}
            <div className="flex flex-col items-center mr-3">
              <div className="flex items-center justify-center w-6 h-6 mb-2 text-xs font-medium rounded-full bg-secondary/50">
                {index + 1}
              </div>
            </div>

            {/* Complete control only (removed selection checkbox) */}
            <div className="flex flex-col items-center gap-2 mt-1 mr-3">
              <StatusToggleButton
                status={localStatus}
                onToggle={handleToggleCompletion}
              />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Status badge */}
                <StatusBadge
                  status={localStatus}
                  onClick={handleStatusChange}
                />

                {/* Priority badge */}
                <PriorityBadge priority={task.priority} />

                {/* Due date */}
                {task.due_date && <DueDateBadge dueDate={task.due_date} />}
              </div>

              {/* Title */}
              <Tooltip content={task.title} position="top" width="w-64">
                <h3
                  className={`text-base font-medium truncate max-w-full ${
                    localStatus === TaskStatus.COMPLETED
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {truncateText(task.title, 50)}
                </h3>
              </Tooltip>

              {/* Details preview */}
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                {task.category && <CategoryBadge category={task.category} />}

                {task.estimated_time_minutes && (
                  <TimeBadge
                    minutes={task.estimated_time_minutes}
                    isLongTerm={task.is_long_term}
                  />
                )}

                {task.energy_level && (
                  <EnergyBadge energyLevel={task.energy_level} />
                )}
              </div>

              {/* Toggle details */}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  className="hidden text-xs text-primary sm:block"
                  onClick={() => setShowDetails(!showDetails)}
                  data-interactive="true"
                >
                  {showDetails ? "Hide details" : "Show details"}
                </button>
                <button
                  className="text-xs text-primary sm:hidden"
                  onClick={() => setShowMobileDetails(true)}
                  data-interactive="true"
                >
                  View details
                </button>

                {/* Mobile actions (edit/delete) */}
                <div className="flex ml-auto space-x-2 sm:hidden">
                  {/* Edit/Delete */}
                  <EditDeleteActions
                    onEdit={() => setShowEditForm(true)}
                    onDelete={handleDeleteClick}
                    isMobile={true}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {showDetails && <TaskItemDetails task={task} />}
            </div>

            {/* Desktop actions (edit/delete) */}
            <div className="items-center hidden ml-4 space-x-2 sm:flex">
              {/* Edit/Delete */}
              <EditDeleteActions
                onEdit={() => setShowEditForm(true)}
                onDelete={handleDeleteClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {taskContent}

      <TaskItemMobileModal
        task={task}
        isOpen={showMobileDetails}
        onClose={() => setShowMobileDetails(false)}
        onEdit={() => {
          setShowMobileDetails(false);
          setShowEditForm(true);
        }}
      />

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Task"
          message={`Are you sure you want to delete "${truncateText(
            task.title,
            50
          )}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          variant="danger"
        />
      )}
    </>
  );
};

export default TaskItem;
