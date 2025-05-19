"use client";

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
  minutesToDays,
} from "@/lib/utils";

interface TaskItemDetailsProps {
  task: Task;
}

const TaskItemDetails = ({ task }: TaskItemDetailsProps) => {
  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString()
    : "No due date";

  return (
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
          <p className="text-xs font-medium text-muted-foreground">Priority:</p>
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
                ? formatDaysDuration(minutesToDays(task.estimated_time_minutes))
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
                : task.recurring_frequency === RecurringFrequency.WEEKLY
                ? "Weekly"
                : task.recurring_frequency === RecurringFrequency.MONTHLY
                ? "Monthly"
                : "Custom"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItemDetails;
