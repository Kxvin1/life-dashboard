import { TaskStatus } from "@/services/taskService";

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
  isMobile = false 
}: MoveActionsProps) => {
  const buttonSize = isMobile ? "w-7 h-7" : "w-8 h-8";
  const iconSize = isMobile ? "16" : "18";
  
  return (
    <div className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50">
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
        title="Move up"
        disabled={index === 0}
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
      <button
        type="button"
        onClick={onMoveDown}
        className={`${buttonSize} flex items-center justify-center rounded-md ${
          isMobile ? "" : "transition-all duration-200"
        } text-foreground hover:text-primary hover:bg-secondary`}
        title="Move down"
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
  isMobile = false 
}: EditDeleteActionsProps) => {
  const buttonSize = isMobile ? "w-7 h-7" : "w-8 h-8";
  const iconSize = isMobile ? "16" : "18";
  
  return (
    <div className="z-10 flex items-center p-1 space-x-1 rounded-lg shadow-sm bg-secondary/50">
      <button
        type="button"
        onClick={onEdit}
        className={`${buttonSize} flex items-center justify-center rounded-md ${
          isMobile ? "" : "transition-all duration-200"
        } text-foreground hover:text-primary hover:bg-secondary`}
        title="Edit task"
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
      <button
        type="button"
        onClick={onDelete}
        className={`${buttonSize} flex items-center justify-center rounded-md ${
          isMobile ? "" : "transition-all duration-200"
        } text-foreground hover:text-destructive hover:bg-destructive/10`}
        title="Delete task"
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
    </div>
  );
};

interface StatusToggleButtonProps {
  status: TaskStatus;
  onToggle: () => void;
}

export const StatusToggleButton = ({ status, onToggle }: StatusToggleButtonProps) => {
  const isCompleted = status === TaskStatus.COMPLETED;
  
  return (
    <button
      onClick={onToggle}
      className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
        isCompleted
          ? "bg-green-500 text-white hover:bg-green-600"
          : "bg-secondary text-foreground hover:bg-secondary/80"
      }`}
      title={isCompleted ? "Mark as not started" : "Mark as completed"}
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
  );
};
