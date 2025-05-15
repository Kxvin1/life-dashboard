"use client";

import { useState } from "react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { v4 as uuidv4 } from "uuid";

const PomodoroTimer = () => {
  const {
    mode,
    displayTime,
    isRunning,
    progress,
    currentTask,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    setCurrentTask,
    addTaskToQueue,
    completeCurrentTask,
    // completedPomodoros, // Local count from localStorage (not used)
    taskQueue,
    streakCount,
    streakTimeRemaining,
    hasCompletedTodayPomodoro,
    todayCount, // Database count
    weeklyCount,
    totalCount,
  } = usePomodoro();

  const [newTaskName, setNewTaskName] = useState("");

  // Get background color based on mode
  const getBackgroundColor = () => {
    switch (mode) {
      case "work":
        return "bg-red-500";
      case "shortBreak":
        return "bg-green-500";
      case "longBreak":
        return "bg-blue-500";
      default:
        return "bg-red-500";
    }
  };

  // This function was replaced by inline rendering in the session type label

  // Get queue length
  const queueLength = taskQueue.length;
  const maxQueueLength = 8;
  const isQueueFull = queueLength >= maxQueueLength;

  // Handle task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskName.trim()) return;

    // Check if queue is full and we already have a current task
    if (isQueueFull && currentTask) {
      alert(`You can only have up to ${maxQueueLength} tasks in the queue.`);
      return;
    }

    const newTask = {
      id: uuidv4(),
      name: newTaskName.trim(),
      completed: false,
      createdAt: new Date(),
    };

    // If no current task, set as current
    if (!currentTask) {
      setCurrentTask(newTask);
    } else {
      // Otherwise add to queue
      addTaskToQueue(newTask);
    }

    // Clear input
    setNewTaskName("");
  };

  return (
    <div className="p-6 rounded-lg bg-secondary/30">
      {/* Timer header */}
      <div className="flex flex-col mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
          <div className="w-full sm:w-1/2">
            <div className="bg-card/50 border border-border rounded-md p-3 w-full">
              <div className="text-sm font-medium text-muted-foreground mb-2 text-center">
                Pomodoros Completed
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-xs md:text-base">
                <div className="flex-1 px-3 py-2 bg-primary/10 rounded-md flex flex-col items-center justify-center">
                  <span className="font-bold text-primary text-lg md:text-xl">
                    {todayCount}
                  </span>
                  <span className="text-xs text-primary/80 mt-1">Today</span>
                </div>
                <div className="flex-1 px-3 py-2 bg-blue-500/10 rounded-md flex flex-col items-center justify-center">
                  <span className="font-bold text-blue-500 text-lg md:text-xl">
                    {weeklyCount}
                  </span>
                  <span className="text-xs text-blue-500/80 mt-1">
                    This Week
                  </span>
                </div>
                <div className="flex-1 px-3 py-2 bg-purple-500/10 rounded-md flex flex-col items-center justify-center">
                  <span className="font-bold text-purple-500 text-lg md:text-xl">
                    {totalCount}
                  </span>
                  <span className="text-xs text-purple-500/80 mt-1">
                    All Time
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-1/2">
            {streakCount > 0 ? (
              <div className="bg-card/50 border border-border rounded-md p-3 w-full">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-sm font-medium text-orange-500 flex items-center">
                    <span className="text-xl mr-1">🔥</span> {streakCount} Day
                    Streak
                  </span>
                </div>
                <div className="bg-orange-500/10 rounded-md p-2 text-center">
                  <div className="text-xs text-orange-500/80">
                    {hasCompletedTodayPomodoro
                      ? "✅ Streak is safe for today!"
                      : "Complete a Pomodoro today to maintain streak"}
                  </div>
                  <div className="text-xs text-orange-500/80 font-medium mt-1">
                    {hasCompletedTodayPomodoro
                      ? `Next streak day begins at midnight PST (${streakTimeRemaining})`
                      : `Streak expires at midnight PST (${streakTimeRemaining})`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card/50 border border-border rounded-md p-3 w-full">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-sm font-medium text-blue-500">
                    Start your streak today!
                  </span>
                </div>
                <div className="bg-blue-500/10 rounded-md p-2 text-center">
                  <div className="text-xs text-blue-500/80">
                    Complete a Pomodoro to begin your streak
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Session type label */}
        <div className="bg-card/50 border border-border rounded-md p-3 mb-4 text-center">
          <div className="flex items-center justify-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${getBackgroundColor()}`}
            ></div>
            <h2 className="text-xl font-semibold">
              {mode === "work"
                ? "Focus Session"
                : mode === "shortBreak"
                ? "Short Break"
                : "Long Break"}
            </h2>
          </div>
        </div>
      </div>

      {/* Timer display */}
      <div className="relative w-full max-w-[16rem] h-64 sm:w-64 mx-auto mb-8">
        {/* Progress circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-secondary"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          {/* Progress circle */}
          <circle
            className={`${getBackgroundColor()} transition-all duration-1000 ease-in-out`}
            strokeWidth="4"
            strokeDasharray={`${progress * 2.64} 264`}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold text-foreground">
            {displayTime}
          </span>
          {currentTask && (
            <span className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-[80%] truncate">
              {currentTask.name}
            </span>
          )}
        </div>
      </div>

      {/* Timer controls */}
      <div className="flex justify-center mb-8 space-x-4">
        {isRunning ? (
          <button
            onClick={pauseTimer}
            className="px-4 py-2 transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={startTimer}
            className="px-4 py-2 text-white transition-colors rounded-md bg-primary hover:bg-primary/80"
          >
            Start
          </button>
        )}
        <button
          onClick={resetTimer}
          className="px-4 py-2 transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80"
        >
          Reset
        </button>
        <button
          onClick={skipTimer}
          className="px-4 py-2 transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80"
          title={
            mode === "work" && isRunning
              ? "Skip (will be counted as interrupted)"
              : "Skip"
          }
        >
          {mode === "work" && isRunning ? "Skip (Interrupt)" : "Skip"}
        </button>
      </div>

      {/* Current task */}
      {mode === "work" && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Current Task
          </h4>
          {currentTask ? (
            <div className="flex items-center justify-between p-3 border rounded-md bg-card border-border">
              <span className="text-foreground truncate max-w-[70%]">
                {currentTask.name}
              </span>
              <button
                onClick={completeCurrentTask}
                className="flex-shrink-0 px-2 py-1 text-sm text-green-500 transition-colors rounded bg-green-500/10 hover:bg-green-500/20 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Complete
              </button>
            </div>
          ) : (
            <div className="p-3 border rounded-md bg-card border-border text-muted-foreground">
              No current task. Add one below.
            </div>
          )}
        </div>
      )}

      {/* Add task form */}
      {mode === "work" && (
        <div>
          <form onSubmit={handleCreateTask} className="mt-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="What are you working on?"
                className="flex-1 px-3 py-2 border bg-background border-border rounded sm:rounded-r-none sm:rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isQueueFull && currentTask !== null}
              />
              <button
                type="submit"
                className={`px-4 py-2 ${
                  isQueueFull && currentTask !== null
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/80"
                } rounded sm:rounded-l-none sm:rounded-r-md transition-colors`}
                disabled={isQueueFull && currentTask !== null}
              >
                Add
              </button>
            </div>
          </form>
          {isQueueFull && currentTask !== null && (
            <p className="mt-2 text-xs text-amber-500">
              Task queue is full (max {maxQueueLength}). Complete or remove
              tasks to add more.
            </p>
          )}
          {!isQueueFull && (
            <p className="mt-2 text-xs text-muted-foreground">
              {queueLength} of {maxQueueLength} tasks in queue
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
