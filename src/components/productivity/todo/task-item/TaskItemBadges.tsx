"use client";

import { TaskStatus, TaskPriority, EnergyLevel } from "@/services/taskService";
import { getStatusColor, getPriorityColor } from "./TaskItemHelpers";
import {
  formatTimeDuration,
  formatDaysDuration,
  minutesToDays,
} from "@/lib/utils";
import Tooltip from "@/components/ui/Tooltip";

interface StatusBadgeProps {
  status: TaskStatus;
  onClick?: () => void;
}

export const StatusBadge = ({ status, onClick }: StatusBadgeProps) => {
  const statusText =
    status === TaskStatus.NOT_STARTED
      ? "Not Started"
      : status === TaskStatus.IN_PROGRESS
      ? "In Progress"
      : "Completed";

  const tooltipContent = `Click to change status: ${statusText}`;

  // Prevent default to avoid any browser-triggered page refresh
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add a small delay to ensure the event is fully handled before calling onClick
    if (onClick) {
      setTimeout(() => {
        onClick();
      }, 0);
    }
  };

  return (
    <Tooltip content={tooltipContent} position="top" width="w-48">
      <span
        className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center whitespace-nowrap ${getStatusColor(
          status
        )}`}
        onClick={handleClick}
        data-interactive="true"
      >
        <span className="mr-1 font-medium">Status:</span>
        <span className="truncate max-w-[80px] sm:max-w-none">
          {statusText}
        </span>
      </span>
    </Tooltip>
  );
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const priorityText =
    priority === TaskPriority.LOW
      ? "Low"
      : priority === TaskPriority.MEDIUM
      ? "Medium"
      : "High";

  const tooltipContent = `Priority: ${priorityText}`;

  return (
    <Tooltip content={tooltipContent} position="top" width="w-40">
      <span
        className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center whitespace-nowrap ${getPriorityColor(
          priority
        )}`}
      >
        <span className="mr-1 font-medium">Priority:</span>
        <span className="truncate max-w-[60px] sm:max-w-none">
          {priorityText}
        </span>
      </span>
    </Tooltip>
  );
};

interface CategoryBadgeProps {
  category: { id: number; name: string };
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const tooltipContent = `Category: ${category.name}`;

  return (
    <Tooltip content={tooltipContent} position="top" width="w-40">
      <span className="bg-secondary/50 px-2 py-0.5 rounded-full inline-flex items-center whitespace-nowrap">
        <span className="mr-1 font-medium">Category:</span>
        <span className="truncate max-w-[80px] sm:max-w-none">
          {category.name}
        </span>
      </span>
    </Tooltip>
  );
};

interface TimeBadgeProps {
  minutes: number;
  isLongTerm: boolean;
}

export const TimeBadge = ({ minutes, isLongTerm }: TimeBadgeProps) => {
  const formattedTime = isLongTerm
    ? formatDaysDuration(minutesToDays(minutes))
    : formatTimeDuration(minutes);

  const tooltipContent = `Estimated time to complete: ${formattedTime}`;

  return (
    <Tooltip content={tooltipContent} position="top" width="w-48">
      <span className="flex items-center whitespace-nowrap">
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
          {formattedTime}
        </span>
      </span>
    </Tooltip>
  );
};

interface EnergyBadgeProps {
  energyLevel: EnergyLevel;
}

export const EnergyBadge = ({ energyLevel }: EnergyBadgeProps) => {
  const energyText =
    energyLevel === EnergyLevel.LOW
      ? "Low"
      : energyLevel === EnergyLevel.MEDIUM
      ? "Medium"
      : "High";

  const tooltipContent = `Energy level: ${energyText} (mental/physical effort required)`;

  return (
    <Tooltip content={tooltipContent} position="top" width="w-48">
      <span className="flex items-center whitespace-nowrap">
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
          {energyText}
        </span>
      </span>
    </Tooltip>
  );
};

interface DueDateBadgeProps {
  dueDate: string | null;
}

export const DueDateBadge = ({ dueDate }: DueDateBadgeProps) => {
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString()
    : "No due date";

  const tooltipContent = `Due date: ${formattedDueDate}`;

  return (
    <Tooltip content={tooltipContent} position="top" width="w-40">
      <span className="inline-flex items-center text-xs text-muted-foreground whitespace-nowrap">
        <span className="mr-1 font-medium">Due:</span>
        <span className="truncate max-w-[80px] sm:max-w-none">
          {formattedDueDate}
        </span>
      </span>
    </Tooltip>
  );
};
