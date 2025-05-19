"use client";

import React from "react";
import Tooltip from "@/components/ui/Tooltip";

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
          <div className="flex items-center">
            <Tooltip
              content={`Switch to ${
                isDetailed
                  ? "a simpler form with fewer fields"
                  : "a detailed form with all available options"
              }`}
              position="bottom"
            >
              <button
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                  isDetailed
                    ? "bg-secondary/70 hover:bg-secondary text-foreground"
                    : "bg-primary/90 hover:bg-primary text-primary-foreground"
                }`}
                onClick={() => setIsDetailed(!isDetailed)}
                aria-label={`Switch to ${
                  isDetailed ? "Simple" : "Detailed"
                } Form`}
              >
                {isDetailed ? (
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
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 9h6" />
                    <path d="M9 15h6" />
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
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 9h6" />
                    <path d="M9 12h6" />
                    <path d="M9 15h6" />
                  </svg>
                )}
                <span className="font-medium text-sm">
                  {isDetailed ? "Simple Form" : "Detailed Form"}
                </span>
              </button>
            </Tooltip>
          </div>
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
