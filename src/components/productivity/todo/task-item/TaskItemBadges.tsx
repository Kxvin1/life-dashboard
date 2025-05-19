import { 
  TaskStatus, 
  TaskPriority, 
  EnergyLevel 
} from "@/services/taskService";
import { 
  getStatusColor, 
  getPriorityColor 
} from "./TaskItemHelpers";
import { 
  formatTimeDuration, 
  formatDaysDuration, 
  minutesToDays 
} from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  onClick?: () => void;
}

export const StatusBadge = ({ status, onClick }: StatusBadgeProps) => {
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center whitespace-nowrap ${getStatusColor(status)}`}
      onClick={onClick}
      title={`Click to change status: ${
        status === TaskStatus.NOT_STARTED
          ? "Not Started"
          : status === TaskStatus.IN_PROGRESS
          ? "In Progress"
          : "Completed"
      }`}
    >
      <span className="mr-1 font-medium">Status:</span>
      <span className="truncate max-w-[80px] sm:max-w-none">
        {status === TaskStatus.NOT_STARTED
          ? "Not Started"
          : status === TaskStatus.IN_PROGRESS
          ? "In Progress"
          : "Completed"}
      </span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center whitespace-nowrap ${getPriorityColor(priority)}`}
      title={`Priority: ${
        priority === TaskPriority.LOW
          ? "Low"
          : priority === TaskPriority.MEDIUM
          ? "Medium"
          : "High"
      }`}
    >
      <span className="mr-1 font-medium">Priority:</span>
      <span className="truncate max-w-[60px] sm:max-w-none">
        {priority === TaskPriority.LOW
          ? "Low"
          : priority === TaskPriority.MEDIUM
          ? "Medium"
          : "High"}
      </span>
    </span>
  );
};

interface CategoryBadgeProps {
  category: { id: number; name: string };
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  return (
    <span
      className="bg-secondary/50 px-2 py-0.5 rounded-full inline-flex items-center whitespace-nowrap"
      title={`Category: ${category.name}`}
    >
      <span className="mr-1 font-medium">Category:</span>
      <span className="truncate max-w-[80px] sm:max-w-none">
        {category.name}
      </span>
    </span>
  );
};

interface TimeBadgeProps {
  minutes: number;
  isLongTerm: boolean;
}

export const TimeBadge = ({ minutes, isLongTerm }: TimeBadgeProps) => {
  return (
    <span
      className="flex items-center whitespace-nowrap"
      title={`Estimated time to complete: ${
        isLongTerm
          ? formatDaysDuration(minutesToDays(minutes))
          : formatTimeDuration(minutes)
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
        {isLongTerm
          ? formatDaysDuration(minutesToDays(minutes))
          : formatTimeDuration(minutes)}
      </span>
    </span>
  );
};

interface EnergyBadgeProps {
  energyLevel: EnergyLevel;
}

export const EnergyBadge = ({ energyLevel }: EnergyBadgeProps) => {
  return (
    <span
      className="flex items-center whitespace-nowrap"
      title={`Energy level: ${
        energyLevel === EnergyLevel.LOW
          ? "Low"
          : energyLevel === EnergyLevel.MEDIUM
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
        {energyLevel === EnergyLevel.LOW
          ? "Low"
          : energyLevel === EnergyLevel.MEDIUM
          ? "Medium"
          : "High"}
      </span>
    </span>
  );
};

interface DueDateBadgeProps {
  dueDate: string | null;
}

export const DueDateBadge = ({ dueDate }: DueDateBadgeProps) => {
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString()
    : "No due date";

  return (
    <span
      className="inline-flex items-center text-xs text-muted-foreground whitespace-nowrap"
      title={`Due date: ${formattedDueDate}`}
    >
      <span className="mr-1 font-medium">Due:</span>
      <span className="truncate max-w-[80px] sm:max-w-none">
        {formattedDueDate}
      </span>
    </span>
  );
};
