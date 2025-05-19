import React from 'react';

interface TaskFormHeaderProps {
  isLongTerm: boolean;
  isEditing: boolean;
  isDetailed: boolean;
  setIsDetailed: (isDetailed: boolean) => void;
  error: string | null;
}

const TaskFormHeader: React.FC<TaskFormHeaderProps> = ({
  isLongTerm,
  isEditing,
  isDetailed,
  setIsDetailed,
  error,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">
          {isEditing ? "Edit" : "Add"} {isLongTerm ? "Long-Term Task" : "Task"}
        </h3>
        {!isEditing && (
          <button
            type="button"
            className="text-sm text-primary"
            onClick={() => setIsDetailed(!isDetailed)}
          >
            {isDetailed ? "Simple Form" : "Detailed Form"}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
          {error}
        </div>
      )}
    </>
  );
};

export default TaskFormHeader;
