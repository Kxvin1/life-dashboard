"use client";

import { TaskStatus } from "@/services/taskService";
import Tooltip from "@/components/ui/Tooltip";

interface MoveActionsProps {
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isMobile?: boolean;
}

export const MoveActions = ({
  index,
  onMoveUp,
  onMoveDown,
  isMobile = false,
}: MoveActionsProps) => {
  const buttonSize = isMobile ? "w-7 h-7" : "w-8 h-8";
  const iconSize = isMobile ? "16" : "18";

  return (
    <div
      className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50"
      data-interactive="true"
    >
      <Tooltip content="Move task up in the list" position="top" width="w-32">
        <button
          type="button"
          onClick={onMoveUp}
          className={`${buttonSize} rounded-md flex items-center justify-center ${
            isMobile ? "" : "transition-all duration-200"
          } ${
            index === 0
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-foreground hover:text-primary hover:bg-secondary"
          }`}
          disabled={index === 0}
          data-interactive="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
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
      </Tooltip>

      <Tooltip content="Move task down in the list" position="top" width="w-32">
        <button
          type="button"
          onClick={onMoveDown}
          className={`${buttonSize} flex items-center justify-center rounded-md ${
            isMobile ? "" : "transition-all duration-200"
          } text-foreground hover:text-primary hover:bg-secondary`}
          data-interactive="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
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
      </Tooltip>
    </div>
  );
};

interface EditDeleteActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isMobile?: boolean;
}

export const EditDeleteActions = ({
  onEdit,
  onDelete,
  isMobile = false,
}: EditDeleteActionsProps) => {
  const buttonSize = isMobile ? "w-7 h-7" : "w-8 h-8";
  const iconSize = isMobile ? "16" : "18";

  return (
    <div
      className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50"
      data-interactive="true"
    >
      <Tooltip content="Edit task details" position="top" width="w-32">
        <button
          type="button"
          onClick={onEdit}
          className={`${buttonSize} flex items-center justify-center rounded-md ${
            isMobile ? "" : "transition-all duration-200"
          } text-foreground hover:text-primary hover:bg-secondary`}
          data-interactive="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
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
      </Tooltip>

      <Tooltip content="Delete this task" position="top" width="w-32">
        <button
          type="button"
          onClick={onDelete}
          className={`${buttonSize} flex items-center justify-center rounded-md ${
            isMobile ? "" : "transition-all duration-200"
          } text-foreground hover:text-destructive hover:bg-destructive/10`}
          data-interactive="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
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
      </Tooltip>
    </div>
  );
};

interface StatusToggleButtonProps {
  status: TaskStatus;
  onToggle: () => void;
}

export const StatusToggleButton = ({
  status,
  onToggle,
}: StatusToggleButtonProps) => {
  const isCompleted = status === TaskStatus.COMPLETED;
  const tooltipContent = isCompleted
    ? "Mark as not started"
    : "Mark as completed";

  // Prevent default to avoid any browser-triggered page refresh
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add a small delay to ensure the event is fully handled before calling onToggle
    if (onToggle) {
      setTimeout(() => {
        onToggle();
      }, 0);
    }
  };

  return (
    <Tooltip content={tooltipContent} position="top" width="w-40">
      <button
        onClick={handleClick}
        className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
          isCompleted
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-secondary text-foreground hover:bg-secondary/80"
        }`}
        data-interactive="true"
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
    </Tooltip>
  );
};
