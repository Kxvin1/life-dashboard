"use client";

import { useState, useEffect } from "react";
import { useTask } from "@/contexts/TaskContext";
import { TaskStatus, TaskPriority, EnergyLevel } from "@/services/taskService";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

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
    tasksPerPage,
  } = useTask();

  const [showForm, setShowForm] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fetch tasks when the tab changes or pagination changes
  useEffect(() => {
    // Ensure we're fetching the correct page of tasks
    fetchTasksByType(isLongTerm, currentPage, tasksPerPage);
  }, [isLongTerm, fetchTasksByType, currentPage, tasksPerPage]);

  // Reset to page 1 when tab, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [isLongTerm, filterStatus, sortBy, sortOrder]);

  // Handle task selection for batch actions
  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Select all tasks on the current page
  const selectAllTasks = () => {
    const currentPageTaskIds = filteredTasks.map((task) => task.id);

    // If all tasks on the current page are already selected, deselect them
    const allSelected = currentPageTaskIds.every((id) =>
      selectedTasks.includes(id)
    );

    if (allSelected) {
      // Deselect all tasks on the current page
      setSelectedTasks((prev) =>
        prev.filter((id) => !currentPageTaskIds.includes(id))
      );
    } else {
      // Select all tasks on the current page
      const newSelectedTasks = [...selectedTasks];
      currentPageTaskIds.forEach((id) => {
        if (!newSelectedTasks.includes(id)) {
          newSelectedTasks.push(id);
        }
      });
      setSelectedTasks(newSelectedTasks);
    }
  };

  // Check if all tasks on the current page are selected
  const areAllTasksSelected = () => {
    if (filteredTasks.length === 0) return false;
    return filteredTasks.every((task) => selectedTasks.includes(task.id));
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
      {/* Header with title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isLongTerm ? "Long-Term Tasks" : "Short-Term Tasks"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {totalTasks} {isLongTerm ? "tasks" : "tasks"} total
        </p>
      </div>

      {/* Redesigned filter controls and add task button */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        {/* Filter section */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Filter
          </label>
          <select
            className="px-3 py-2 text-sm rounded-md border border-border bg-card text-foreground hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value={TaskStatus.NOT_STARTED}>Not Started</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        {/* Sort section */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Sort By
          </label>
          <div className="flex items-center gap-1">
            <select
              className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-card text-foreground hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
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
              className="p-2 transition-colors rounded-md border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/50"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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

        {/* Add task button - redesigned to match AI button */}
        <div className="flex items-end">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-medium transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20"
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
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Select All checkbox */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center mb-3 gap-2">
          <div className="relative">
            <input
              type="checkbox"
              id="select-all-tasks"
              checked={areAllTasksSelected()}
              onChange={selectAllTasks}
              className="sr-only peer"
            />
            <label
              htmlFor="select-all-tasks"
              className="flex items-center justify-center w-5 h-5 transition-colors duration-200 border rounded cursor-pointer border-border bg-background peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/30"
            >
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
                className={`${
                  areAllTasksSelected() ? "opacity-100" : "opacity-0"
                } text-primary-foreground`}
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </label>
          </div>
          <span className="text-sm text-foreground">Select All</span>
        </div>
      )}

      {/* Pagination - Moved to top of task list */}
      {totalTasks > tasksPerPage && (
        <div className="flex justify-center mb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalTasks / tasksPerPage)}
            totalItems={totalTasks}
            itemsPerPage={tasksPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              // Scroll to top when changing pages
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {/* Selected items actions removed from here - moved to task list section */}

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
        // Task list with pagination
        <>
          {/* Selection UI that scrolls with the page */}
          {selectedTasks.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 p-3 rounded-md bg-card border border-border shadow-lg max-w-md mx-auto">
                <span className="mr-2 text-sm font-medium">
                  {selectedTasks.length} selected
                </span>
                <button
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedTasks.length === 0}
                >
                  Delete
                </button>
                <button
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors ml-auto"
                  onClick={clearSelections}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <TaskList
            tasks={filteredTasks}
            isSelected={isTaskSelected}
            onSelect={toggleTaskSelection}
          />
        </>
      )}

      {/* No selection UI here - moved to task list section */}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
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
      )}
    </div>
  );
};

export default TodoList;
