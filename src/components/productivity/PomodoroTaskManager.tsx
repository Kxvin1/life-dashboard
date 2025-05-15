"use client";

import { usePomodoro } from "@/contexts/PomodoroContext";

const PomodoroTaskManager = () => {
  const { taskQueue, removeTaskFromQueue, reorderTaskQueue } = usePomodoro();

  // Handle move up
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderTaskQueue(index, index - 1);
    }
  };

  // Handle move down
  const handleMoveDown = (index: number) => {
    if (index < taskQueue.length - 1) {
      reorderTaskQueue(index, index + 1);
    }
  };

  return (
    <div className="bg-secondary/30 rounded-lg p-6 h-full">
      <h3 className="text-lg font-medium text-foreground mb-4">Task Queue</h3>

      {taskQueue.length === 0 ? (
        <div className="bg-card p-4 rounded-md border border-border text-muted-foreground text-center">
          No tasks in queue. Add tasks to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {taskQueue.map((task, index) => (
            <div
              key={task.id}
              className="bg-card p-3 rounded-md border border-border flex items-center justify-between group"
            >
              <div className="flex items-center min-w-0 overflow-hidden">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center mr-2 text-muted-foreground">
                  {index + 1}
                </div>
                <span className="text-foreground truncate">{task.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`text-muted-foreground hover:text-foreground ${
                      index === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "opacity-0 group-hover:opacity-100"
                    } transition-opacity`}
                    aria-label="Move up"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === taskQueue.length - 1}
                    className={`text-muted-foreground hover:text-foreground ${
                      index === taskQueue.length - 1
                        ? "opacity-30 cursor-not-allowed"
                        : "opacity-0 group-hover:opacity-100"
                    } transition-opacity`}
                    aria-label="Move down"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => removeTaskFromQueue(task.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove task"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        <p>Use the arrows to reorder tasks.</p>
        <p className="mt-1">Tasks will automatically start after breaks.</p>
      </div>
    </div>
  );
};

export default PomodoroTaskManager;
