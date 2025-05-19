"use client";

import { useState, useEffect } from "react";
import { useTask } from "@/contexts/TaskContext";
import {
  Task,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
  RecurringFrequency,
} from "@/services/taskService";
import TaskForm from "./TaskForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  truncateText,
  formatTimeDuration,
  formatDaysDuration,
  minutesToDays,
} from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  index: number;
  isSelected: boolean;
  onSelect: (taskId: number) => void;
  onMoveUp?: (taskId: number, currentIndex: number) => Promise<void>;
  onMoveDown?: (taskId: number, currentIndex: number) => Promise<void>;
}

const TaskItem = ({
  task,
  index,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
}: TaskItemProps) => {
  const { changeTaskStatus, removeTask } = useTask();
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

  // Format due date
  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString()
    : "No due date";

  // Helpers for badge colors
  const getStatusColor = () => {
    switch (task.status) {
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
  const getStatusBackgroundColor = () => {
    switch (task.status) {
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
  const getPriorityColor = () => {
    switch (task.priority) {
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

  // Cycle status: Not Started → In Progress → Completed → Not Started
  const handleStatusChange = async () => {
    let newStatus: TaskStatus;
    switch (task.status) {
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
    try {
      await changeTaskStatus(task.id, newStatus);
    } catch (error) {
      console.error("Error changing task status:", error);
    }
  };

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

  // Direct handlers for move buttons
  const handleMoveUp = () => {
    if (index > 0 && onMoveUp) {
      onMoveUp(task.id, index);
    }
  };

  const handleMoveDown = () => {
    if (onMoveDown) {
      onMoveDown(task.id, index);
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
      className={`${getStatusBackgroundColor()} border ${
        isSelected ? "border-primary" : "border-border"
      } rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-md`}
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

            {/* Selection & complete controls */}
            <div className="flex flex-col items-center gap-2 mt-1 mr-3">
              <div className="relative">
                {/* Hide the actual checkbox but keep functionality */}
                <input
                  type="checkbox"
                  id={`select-task-${task.id}`}
                  checked={isSelected}
                  onChange={() => onSelect(task.id)}
                  className="sr-only peer"
                />
                <label
                  htmlFor={`select-task-${task.id}`}
                  className="flex items-center justify-center w-5 h-5 transition-all duration-200 border rounded cursor-pointer border-border bg-background peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/30"
                  title="Select task"
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary-foreground"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </label>
              </div>

              <button
                onClick={() =>
                  changeTaskStatus(
                    task.id,
                    task.status === TaskStatus.COMPLETED
                      ? TaskStatus.NOT_STARTED
                      : TaskStatus.COMPLETED
                  )
                }
                className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                  task.status === TaskStatus.COMPLETED
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
                title={
                  task.status === TaskStatus.COMPLETED
                    ? "Mark as not started"
                    : "Mark as completed"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </button>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Status badge */}
                <span
                  className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center whitespace-nowrap ${getStatusColor()}`}
                  onClick={handleStatusChange}
                  title={`Click to change status: ${
                    task.status === TaskStatus.NOT_STARTED
                      ? "Not Started"
                      : task.status === TaskStatus.IN_PROGRESS
                      ? "In Progress"
                      : "Completed"
                  }`}
                >
                  <span className="mr-1 font-medium">Status:</span>
                  <span className="truncate max-w-[80px] sm:max-w-none">
                    {task.status === TaskStatus.NOT_STARTED
                      ? "Not Started"
                      : task.status === TaskStatus.IN_PROGRESS
                      ? "In Progress"
                      : "Completed"}
                  </span>
                </span>

                {/* Priority badge */}
                <span
                  className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center whitespace-nowrap ${getPriorityColor()}`}
                  title={`Priority: ${
                    task.priority === TaskPriority.LOW
                      ? "Low"
                      : task.priority === TaskPriority.MEDIUM
                      ? "Medium"
                      : "High"
                  }`}
                >
                  <span className="mr-1 font-medium">Priority:</span>
                  <span className="truncate max-w-[60px] sm:max-w-none">
                    {task.priority === TaskPriority.LOW
                      ? "Low"
                      : task.priority === TaskPriority.MEDIUM
                      ? "Medium"
                      : "High"}
                  </span>
                </span>

                {/* Due date */}
                {task.due_date && (
                  <span
                    className="inline-flex items-center text-xs text-muted-foreground whitespace-nowrap"
                    title={`Due date: ${formattedDueDate}`}
                  >
                    <span className="mr-1 font-medium">Due:</span>
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {formattedDueDate}
                    </span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className={`text-base font-medium truncate max-w-full ${
                  task.status === TaskStatus.COMPLETED
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
                title={task.title}
              >
                {truncateText(task.title, 50)}
              </h3>

              {/* Details preview */}
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                {task.category && (
                  <span
                    className="bg-secondary/50 px-2 py-0.5 rounded-full inline-flex items-center whitespace-nowrap"
                    title={`Category: ${task.category.name}`}
                  >
                    <span className="mr-1 font-medium">Category:</span>
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {task.category.name}
                    </span>
                  </span>
                )}

                {task.estimated_time_minutes && (
                  <span
                    className="flex items-center whitespace-nowrap"
                    title={`Estimated time to complete: ${
                      task.is_long_term
                        ? formatDaysDuration(
                            minutesToDays(task.estimated_time_minutes)
                          )
                        : formatTimeDuration(task.estimated_time_minutes)
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mr-1"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="mr-1 font-medium">Time:</span>
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {task.is_long_term
                        ? formatDaysDuration(
                            minutesToDays(task.estimated_time_minutes)
                          )
                        : formatTimeDuration(task.estimated_time_minutes)}
                    </span>
                  </span>
                )}

                {task.energy_level && (
                  <span
                    className="flex items-center whitespace-nowrap"
                    title={`Energy level: ${
                      task.energy_level === EnergyLevel.LOW
                        ? "Low"
                        : task.energy_level === EnergyLevel.MEDIUM
                        ? "Medium"
                        : "High"
                    } (mental/physical effort required)`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mr-1"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span className="mr-1 font-medium">Energy:</span>
                    <span className="truncate max-w-[60px] sm:max-w-none">
                      {task.energy_level === EnergyLevel.LOW
                        ? "Low"
                        : task.energy_level === EnergyLevel.MEDIUM
                        ? "Medium"
                        : "High"}
                    </span>
                  </span>
                )}
              </div>

              {/* Toggle details */}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  className="hidden text-xs text-primary sm:block"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "Show details"}
                </button>
                <button
                  className="text-xs text-primary sm:hidden"
                  onClick={() => setShowMobileDetails(true)}
                >
                  View details
                </button>

                {/* Mobile actions (up/down/edit/delete) */}
                <div className="flex ml-auto space-x-2 sm:hidden">
                  {/* Move */}
                  <div className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50">
                    <button
                      type="button"
                      onClick={handleMoveUp}
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        index === 0
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : "text-foreground hover:text-primary hover:bg-secondary"
                      }`}
                      title="Move up"
                      disabled={index === 0}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleMoveDown}
                      className="flex items-center justify-center rounded-md w-7 h-7 text-foreground hover:text-primary hover:bg-secondary"
                      title="Move down"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit/Delete */}
                  <div className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(true)}
                      className="flex items-center justify-center rounded-md w-7 h-7 text-foreground hover:text-primary hover:bg-secondary"
                      title="Edit task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="flex items-center justify-center rounded-md w-7 h-7 text-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {showDetails && (
                <div className="p-4 mt-3 border rounded-md shadow-sm bg-background/50 border-border/50">
                  <h4 className="flex items-center mb-3 text-sm font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Task Details
                  </h4>

                  {task.description && (
                    <div className="mb-4">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Description:
                      </p>
                      <p className="text-sm break-words whitespace-pre-wrap text-foreground">
                        {task.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 text-sm sm:grid-cols-2 gap-x-4 gap-y-3">
                    {/* Status */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Status:
                      </p>
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
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Mental/physical effort required
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

                    {/* Recurring */}
                    {task.is_recurring && task.recurring_frequency && (
                      <div>
                        <p className="flex items-center text-xs font-medium text-muted-foreground">
                          Recurring:
                          <span
                            className="ml-1 text-xs text-muted-foreground/70 cursor-help"
                            title="This task is marked as recurring. Note: You'll need to manually create new instances after completion."
                          >
                            (Manual)
                          </span>
                        </p>
                        <p className="text-foreground">
                          {task.recurring_frequency === RecurringFrequency.DAILY
                            ? "Daily"
                            : task.recurring_frequency ===
                              RecurringFrequency.WEEKLY
                            ? "Weekly"
                            : task.recurring_frequency ===
                              RecurringFrequency.MONTHLY
                            ? "Monthly"
                            : "Custom"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop actions (up/down/edit/delete) */}
            <div className="items-center hidden ml-4 space-x-2 sm:flex">
              {/* Move */}
              <div className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50">
                <button
                  type="button"
                  onClick={handleMoveUp}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ${
                    index === 0
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : "text-foreground hover:text-primary hover:bg-secondary"
                  }`}
                  title="Move up"
                  disabled={index === 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleMoveDown}
                  className="flex items-center justify-center w-8 h-8 transition-all duration-200 rounded-md text-foreground hover:text-primary hover:bg-secondary"
                  title="Move down"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Edit/Delete */}
              <div className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50">
                <button
                  type="button"
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center justify-center w-8 h-8 transition-all duration-200 rounded-md text-foreground hover:text-primary hover:bg-secondary"
                  title="Edit task"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="flex items-center justify-center w-8 h-8 transition-all duration-200 rounded-md text-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete task"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile details modal
  const mobileDetailsModal = showMobileDetails && (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:hidden">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowMobileDetails(false)}
      ></div>
      <div className="w-full max-w-md p-6 mx-auto overflow-hidden transition-all transform bg-card rounded-t-xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Task Details</h3>
          <button
            onClick={() => setShowMobileDetails(false)}
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
              setShowMobileDetails(false);
              setShowEditForm(true);
            }}
            className="px-3 py-1 text-sm rounded-md bg-secondary text-foreground"
          >
            Edit Task
          </button>
          <button
            onClick={() => setShowMobileDetails(false)}
            className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {taskContent}
      {mobileDetailsModal}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
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
    </>
  );
};

export default TaskItem;
