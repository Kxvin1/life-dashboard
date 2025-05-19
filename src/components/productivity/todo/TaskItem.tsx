"use client";

import { useState, useEffect } from "react";
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
  MoveActions,
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

  // Toggle task completion status
  const handleToggleCompletion = () => {
    changeTaskStatus(
      task.id,
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.NOT_STARTED
        : TaskStatus.COMPLETED
    );
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
      className={`${getStatusBackgroundColor(task.status)} border ${
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
                <Tooltip content="Select task" position="top" width="w-24">
                  <label
                    htmlFor={`select-task-${task.id}`}
                    className="flex items-center justify-center w-5 h-5 transition-all duration-200 border rounded cursor-pointer border-border bg-background peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/30"
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
                </Tooltip>
              </div>

              <StatusToggleButton
                status={task.status}
                onToggle={handleToggleCompletion}
              />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Status badge */}
                <StatusBadge
                  status={task.status}
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
                    task.status === TaskStatus.COMPLETED
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
                  <MoveActions
                    index={index}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isMobile={true}
                  />

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

            {/* Desktop actions (up/down/edit/delete) */}
            <div className="items-center hidden ml-4 space-x-2 sm:flex">
              {/* Move */}
              <MoveActions
                index={index}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />

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
