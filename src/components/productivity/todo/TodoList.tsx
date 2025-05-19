"use client";

import { useState, useEffect } from "react";
import { useTask } from "@/contexts/TaskContext";
import { TaskStatus, TaskPriority, EnergyLevel } from "@/services/taskService";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import TaskAIButton from "./TaskAIButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface TodoListProps {
  isLongTerm: boolean;
}

const TodoList = ({ isLongTerm }: TodoListProps) => {
  const {
    shortTermTasks,
    longTermTasks,
    totalShortTermTasks,
    totalLongTermTasks,
    isLoading,
    error,
    fetchTasksByType,
    completeTasks,
    deleteTasks,
  } = useTask();

  const [showForm, setShowForm] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sorting state
  type SortOption =
    | "dateAdded"
    | "priority"
    | "energy"
    | "dueDate"
    | "timeEstimate";
  const [sortBy, setSortBy] = useState<SortOption>("dateAdded");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const totalTasks = isLongTerm ? totalLongTermTasks : totalShortTermTasks;

  // Get the appropriate tasks based on the tab
  const tasks = isLongTerm ? longTermTasks : shortTermTasks;

  // Filter tasks by status if a filter is selected
  let filteredTasks = filterStatus
    ? tasks.filter((task) => task.status === filterStatus)
    : tasks;

  // Sort tasks based on selected criteria
  filteredTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "priority":
        // Convert priority enum to numeric value for comparison
        const priorityValues = {
          [TaskPriority.LOW]: 1,
          [TaskPriority.MEDIUM]: 2,
          [TaskPriority.HIGH]: 3,
        };
        comparison = priorityValues[b.priority] - priorityValues[a.priority];
        break;

      case "energy":
        // Convert energy level enum to numeric value for comparison
        // Handle undefined energy levels (sort them last)
        if (!a.energy_level && !b.energy_level) comparison = 0;
        else if (!a.energy_level) comparison = 1;
        else if (!b.energy_level) comparison = -1;
        else {
          const energyValues = {
            [EnergyLevel.LOW]: 1,
            [EnergyLevel.MEDIUM]: 2,
            [EnergyLevel.HIGH]: 3,
          };
          comparison =
            energyValues[a.energy_level] - energyValues[b.energy_level];
        }
        break;

      case "dueDate":
        // Sort by due date (tasks without due dates come last)
        if (!a.due_date && !b.due_date) comparison = 0;
        else if (!a.due_date) comparison = 1;
        else if (!b.due_date) comparison = -1;
        else
          comparison =
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        break;

      case "timeEstimate":
        // Sort by time estimate (tasks without estimates come last)
        if (!a.estimated_time_minutes && !b.estimated_time_minutes)
          comparison = 0;
        else if (!a.estimated_time_minutes) comparison = 1;
        else if (!b.estimated_time_minutes) comparison = -1;
        else comparison = a.estimated_time_minutes - b.estimated_time_minutes;
        break;

      case "dateAdded":
      default:
        // Sort by ID (newer tasks have higher IDs)
        comparison = b.id - a.id;
        break;
    }

    // Reverse the comparison if sort order is ascending
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Fetch tasks when the tab changes
  useEffect(() => {
    fetchTasksByType(isLongTerm);
  }, [isLongTerm, fetchTasksByType]);

  // Handle task selection for batch actions
  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedTasks([]);
  };

  // Check if a task is selected
  const isTaskSelected = (taskId: number) => {
    return selectedTasks.includes(taskId);
  };

  return (
    <div>
      {/* Header with actions */}
      <div className="flex flex-col items-start justify-between gap-4 mb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {isLongTerm ? "Long-Term Tasks" : "Short-Term Tasks"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalTasks} {isLongTerm ? "tasks" : "tasks"} total
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filter dropdown */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="px-3 py-1 text-sm rounded-md bg-secondary text-foreground"
              value={filterStatus || ""}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value={TaskStatus.NOT_STARTED}>Not Started</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
            </select>

            {/* Sort dropdown */}
            <div className="flex items-center gap-1">
              <select
                className="px-3 py-1 text-sm rounded-md bg-secondary text-foreground"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort by"
              >
                <option value="dateAdded">Date Added</option>
                <option value="priority">Priority</option>
                <option value="energy">Energy Level</option>
                <option value="dueDate">Due Date</option>
                <option value="timeEstimate">Time Estimate</option>
              </select>

              {/* Sort order toggle button */}
              <button
                className="p-1 transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                title={
                  sortOrder === "asc"
                    ? "Switch to descending order"
                    : "Switch to ascending order"
                }
                aria-label="Toggle sort order"
              >
                {sortOrder === "asc" ? (
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
                    <path d="m3 8 4-4 4 4" />
                    <path d="M7 4v16" />
                    <path d="M11 12h4" />
                    <path d="M11 16h7" />
                    <path d="M11 20h10" />
                  </svg>
                ) : (
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
                    <path d="m3 16 4 4 4-4" />
                    <path d="M7 20V4" />
                    <path d="M11 4h10" />
                    <path d="M11 8h7" />
                    <path d="M11 12h4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* AI Button for goal breakdown */}
          {isLongTerm && <TaskAIButton />}

          {/* Add task button */}
          <button
            className="flex items-center px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground"
            onClick={() => setShowForm(true)}
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
              className="mr-1"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add {isLongTerm ? "Long-Term Task" : "Task"}
          </button>
        </div>
      </div>

      {/* Selected items actions */}
      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 mb-4 rounded-md bg-secondary/30">
          <span className="mr-2 text-sm text-muted-foreground">
            {selectedTasks.length} selected
          </span>
          <button
            className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground"
            onClick={async () => {
              try {
                await completeTasks(selectedTasks);
                clearSelections();
              } catch (error) {
                console.error("Error completing tasks:", error);
              }
            }}
            disabled={selectedTasks.length === 0}
          >
            Complete
          </button>
          <button
            className="px-2 py-1 text-xs rounded-md bg-secondary text-foreground"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedTasks.length === 0}
          >
            Delete
          </button>
          <button
            className="px-2 py-1 ml-auto text-xs rounded-md bg-secondary text-foreground"
            onClick={clearSelections}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Task form */}
      {showForm && (
        <div className="mb-6">
          <TaskForm
            isLongTerm={isLongTerm}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 mb-4 border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-6 h-6 border-2 rounded-full border-primary animate-spin border-t-transparent"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        // Empty state
        <div className="p-8 text-center rounded-md bg-secondary/30">
          <p className="text-muted-foreground">
            No {isLongTerm ? "tasks" : "tasks"} found.{" "}
            {!showForm && (
              <button
                className="underline text-primary"
                onClick={() => setShowForm(true)}
              >
                Add one
              </button>
            )}
          </p>
        </div>
      ) : (
        // Task list
        <TaskList
          tasks={filteredTasks}
          isSelected={isTaskSelected}
          onSelect={toggleTaskSelection}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Tasks"
        message={`Are you sure you want to delete ${
          selectedTasks.length
        } selected ${
          selectedTasks.length === 1 ? "task" : "tasks"
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={async () => {
          try {
            await deleteTasks(selectedTasks);
            clearSelections();
          } catch (error) {
            console.error("Error deleting tasks:", error);
          } finally {
            setShowDeleteConfirm(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  );
};

export default TodoList;
