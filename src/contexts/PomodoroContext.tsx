"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import {
  createPomodoroSession,
  getPomodoroCounts,
  getPomodoroStreak,
} from "@/services/pomodoroService";
import { useAuth } from "./AuthContext";

// Timer durations in minutes
const WORK_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 20; // Changed to 20 minutes as requested
const POMODOROS_UNTIL_LONG_BREAK = 3; // Changed to 3 as requested

// Timer modes
export type TimerMode = "work" | "shortBreak" | "longBreak";

// Task interface
export interface PomodoroTask {
  id: string;
  name: string;
  completed: boolean;
  createdAt: Date;
}

// Timer state interface
interface TimerState {
  mode: TimerMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  completedPomodoros: number;
  currentTask: PomodoroTask | null;
  lastUpdateTime?: number; // timestamp when the timer was last updated
}

// Context interface
interface PomodoroContextType {
  // Timer state
  mode: TimerMode;
  timeRemaining: number;
  isRunning: boolean;
  completedPomodoros: number;
  displayTime: string;
  progress: number;

  // Streak state (will be fetched from backend)
  streakCount: number;
  hasCompletedTodayPomodoro: boolean;

  // Counts
  todayCount: number;
  weeklyCount: number;
  totalCount: number;

  // Task state
  currentTask: PomodoroTask | null;
  taskQueue: PomodoroTask[];

  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;

  // Task management
  setCurrentTask: (task: PomodoroTask | null) => void;
  addTaskToQueue: (task: PomodoroTask) => void;
  removeTaskFromQueue: (taskId: string) => void;
  reorderTaskQueue: (startIndex: number, endIndex: number) => void;
  completeCurrentTask: () => void;
  clearCurrentTask: () => void;

  // Mini timer
  showMiniTimer: boolean;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(
  undefined
);

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const { user, isDemoUser } = useAuth();
  // Load saved state from localStorage
  const loadSavedState = () => {
    if (typeof window === "undefined") {
      return {
        timerState: {
          mode: "work" as TimerMode,
          timeRemaining: WORK_MINUTES * 60,
          isRunning: false,
          completedPomodoros: 0,
          currentTask: null,
          lastUpdateTime: Date.now(),
        },
        taskQueue: [],
        showMiniTimer: false,
        streakCount: 0,
      };
    }

    try {
      const savedTimerState = localStorage.getItem("pomodoroTimerState");
      const savedTaskQueue = localStorage.getItem("pomodoroTaskQueue");
      // Mini timer is always disabled now

      // Get current time
      const now = Date.now();

      // Parse saved timer state
      const parsedTimerState = savedTimerState
        ? JSON.parse(savedTimerState)
        : null;

      // Always ensure timer is not running when loading from localStorage
      if (parsedTimerState) {
        parsedTimerState.isRunning = false;
        parsedTimerState.lastUpdateTime = now;
      }

      // Parse task queue but ensure it's a valid array
      let parsedTaskQueue = [];
      if (savedTaskQueue) {
        try {
          const parsed = JSON.parse(savedTaskQueue);
          if (Array.isArray(parsed)) {
            parsedTaskQueue = parsed;
          }
        } catch (e) {
          console.error("Error parsing task queue:", e);
        }
      }

      return {
        timerState: parsedTimerState || {
          mode: "work" as TimerMode,
          timeRemaining: WORK_MINUTES * 60,
          isRunning: false,
          completedPomodoros: 0,
          currentTask: null,
          lastUpdateTime: now,
        },
        taskQueue: parsedTaskQueue,
        showMiniTimer: false, // Always disable mini timer
        streakCount: 0,
      };
    } catch (error) {
      console.error("Error loading saved Pomodoro state:", error);
      return {
        timerState: {
          mode: "work" as TimerMode,
          timeRemaining: WORK_MINUTES * 60,
          isRunning: false,
          completedPomodoros: 0,
          currentTask: null,
          lastUpdateTime: Date.now(),
        },
        taskQueue: [],
        showMiniTimer: false,
        streakCount: 0,
      };
    }
  };

  const savedState = loadSavedState();

  const [timerState, setTimerState] = useState<TimerState>(
    savedState.timerState
  );
  const [taskQueue, setTaskQueue] = useState<PomodoroTask[]>(
    savedState.taskQueue
  );
  // Mini timer state - disabled due to issues
  const [showMiniTimer, setShowMiniTimer] = useState(false);
  const [streakCount, setStreakCount] = useState(savedState.streakCount);
  const [hasCompletedTodayPomodoro, setHasCompletedTodayPomodoro] =
    useState(false);

  // Database-backed counts
  const [todayCount, setTodayCount] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch counts from database when user is available
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (user) {
          // Fetch counts for both demo and regular users
          // Demo users will get hardcoded values from the API
          const counts = await getPomodoroCounts();
          setTodayCount(counts.today);
          setWeeklyCount(counts.week);
          setTotalCount(counts.total);
        }
      } catch (error) {
        console.error("Failed to fetch Pomodoro counts:", error);
      }
    };

    // Fetch counts when user becomes available
    if (user) {
      fetchCounts();
    }
  }, [user, isDemoUser]);

  // Fetch streak data from backend when user is available
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        if (user) {
          // Fetch streak data for both demo and regular users
          // Demo users will get hardcoded values from the API
          const streakData = await getPomodoroStreak();
          setStreakCount(streakData.streak_count);
          setHasCompletedTodayPomodoro(streakData.has_completed_today);
        }
      } catch (error) {
        console.error("Failed to fetch Pomodoro streak:", error);
        // Set default values on error
        setStreakCount(0);
        setHasCompletedTodayPomodoro(false);
      }
    };

    // Fetch streak when user becomes available
    if (user) {
      fetchStreak();
    }
  }, [user, isDemoUser]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only save timer state if it's running or if we're explicitly pausing it
      // This prevents the timer from continuing to run when navigating away
      const updatedTimerState = {
        ...timerState,
        isRunning: false, // Always save as paused to prevent running in background
        lastUpdateTime: Date.now(),
      };

      localStorage.setItem(
        "pomodoroTimerState",
        JSON.stringify(updatedTimerState)
      );
      localStorage.setItem("pomodoroTaskQueue", JSON.stringify(taskQueue));
      localStorage.setItem(
        "pomodoroShowMiniTimer",
        JSON.stringify(showMiniTimer)
      );
    }
  }, [timerState, taskQueue, showMiniTimer]);

  // Audio refs
  const timerCompleteSound = useRef<HTMLAudioElement | null>(null);
  const timerTickSound = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        timerCompleteSound.current = new Audio("/sounds/timer-complete.mp3");
        timerCompleteSound.current.volume = 0.3; // Lower volume to 30%
        timerCompleteSound.current.load();

        timerTickSound.current = new Audio("/sounds/timer-tick.mp3");
        timerTickSound.current.volume = 0.2; // Lower volume to 20%
        timerTickSound.current.load();
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    }
  }, []);

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    // Play completion sound
    if (timerCompleteSound.current) {
      try {
        timerCompleteSound.current.currentTime = 0;
        timerCompleteSound.current
          .play()
          .catch((e) => console.error("Error playing complete sound:", e));
      } catch (error) {
        console.error("Error playing complete sound:", error);
      }
    }

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification("Pomodoro Timer", {
        body: `${
          timerState.mode === "work" ? "Work session" : "Break"
        } completed!`,
        icon: "/favicon.ico",
      });
    }

    // If work session completed, save to database
    if (timerState.mode === "work") {
      // Save to database if not demo user
      if (!isDemoUser && user) {
        try {
          // For timer completion, the full duration was used
          // But we'll calculate it explicitly to be consistent with other methods
          const totalSeconds = WORK_MINUTES * 60;

          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - totalSeconds * 1000);

          const sessionData = {
            task_name: timerState.currentTask?.name || "Unnamed Task",
            start_time: startTime,
            end_time: endTime,
            duration_minutes: WORK_MINUTES,
            status: "completed" as const,
            notes: "Timer completed",
          };

          await createPomodoroSession(sessionData);

          // Update counts and streak after successful save
          try {
            const counts = await getPomodoroCounts();
            setTodayCount(counts.today);
            setWeeklyCount(counts.week);
            setTotalCount(counts.total);
          } catch (error) {
            console.error("Failed to update Pomodoro counts:", error);
          }

          // Update streak data
          try {
            const streakData = await getPomodoroStreak();
            setStreakCount(streakData.streak_count);
            setHasCompletedTodayPomodoro(streakData.has_completed_today);
          } catch (error) {
            console.error("Failed to update Pomodoro streak:", error);
          }
        } catch (error) {
          console.error("Failed to save Pomodoro session:", error);
        }
      }
    }

    // Update state based on current mode
    if (timerState.mode === "work") {
      // Increment completed pomodoros
      const newCompletedPomodoros = timerState.completedPomodoros + 1;

      // Determine next break type
      const nextMode =
        newCompletedPomodoros % POMODOROS_UNTIL_LONG_BREAK === 0
          ? "longBreak"
          : "shortBreak";
      const nextTimeRemaining =
        nextMode === "longBreak"
          ? LONG_BREAK_MINUTES * 60
          : SHORT_BREAK_MINUTES * 60;

      setTimerState((prev) => ({
        ...prev,
        mode: nextMode,
        timeRemaining: nextTimeRemaining,
        isRunning: true, // Auto-start break
        completedPomodoros: newCompletedPomodoros,
      }));
    } else {
      // Break completed, move to next task if available
      let nextTask = timerState.currentTask;

      if (taskQueue.length > 0) {
        // Get next task from queue
        nextTask = taskQueue[0];
        // Remove it from queue
        setTaskQueue((prev) => prev.slice(1));
      }

      // Start next work session
      setTimerState((prev) => ({
        ...prev,
        mode: "work",
        timeRemaining: WORK_MINUTES * 60,
        isRunning: true, // Auto-start work
        currentTask: nextTask,
      }));
    }
  }, [
    timerState.mode,
    timerState.completedPomodoros,
    timerState.currentTask,
    taskQueue,
    isDemoUser,
    user,
  ]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Function to update timer
    const updateTimer = () => {
      // Get current time
      const now = Date.now();

      // If timer is running, check if we need to update
      if (timerState.isRunning) {
        // Calculate elapsed time since last update
        const lastUpdateTime = timerState.lastUpdateTime || now;
        const elapsedSeconds = Math.floor((now - lastUpdateTime) / 1000);

        // Only update if at least 1 second has passed
        if (elapsedSeconds > 0) {
          // Calculate new remaining time
          const newTimeRemaining = Math.max(
            0,
            timerState.timeRemaining - elapsedSeconds
          );

          // Update timer state
          setTimerState((prev) => ({
            ...prev,
            timeRemaining: newTimeRemaining,
            lastUpdateTime: now,
          }));

          // Play tick sound every minute
          if (
            Math.floor(timerState.timeRemaining / 60) !==
              Math.floor(newTimeRemaining / 60) &&
            timerTickSound.current
          ) {
            try {
              timerTickSound.current.currentTime = 0;
              timerTickSound.current
                .play()
                .catch((e) => console.error("Error playing tick sound:", e));
            } catch (error) {
              console.error("Error playing tick sound:", error);
            }
          }

          // Check if timer completed
          if (newTimeRemaining <= 0 && timerState.timeRemaining > 0) {
            handleTimerComplete();
          }
        }
      }
    };

    // Update immediately
    updateTimer();

    // Set interval to update every 500ms
    interval = setInterval(updateTimer, 500);

    // Add visibility change listener to handle tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timerState, handleTimerComplete]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    const totalSeconds = getTotalSeconds(timerState.mode);
    return ((totalSeconds - timerState.timeRemaining) / totalSeconds) * 100;
  };

  // Get total seconds for current mode
  const getTotalSeconds = (mode: TimerMode): number => {
    switch (mode) {
      case "work":
        return WORK_MINUTES * 60;
      case "shortBreak":
        return SHORT_BREAK_MINUTES * 60;
      case "longBreak":
        return LONG_BREAK_MINUTES * 60;
      default:
        return WORK_MINUTES * 60;
    }
  };

  // Timer controls
  const startTimer = useCallback(() => {
    // Request notification permission if not granted
    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }

    // Ensure timer is set to the correct duration when starting
    setTimerState((prev) => {
      // If timer is at 0 or very low, reset it to the appropriate duration
      let timeRemaining = prev.timeRemaining;
      if (timeRemaining <= 5) {
        // If less than 5 seconds remaining
        switch (prev.mode) {
          case "work":
            timeRemaining = WORK_MINUTES * 60;
            break;
          case "shortBreak":
            timeRemaining = SHORT_BREAK_MINUTES * 60;
            break;
          case "longBreak":
            timeRemaining = LONG_BREAK_MINUTES * 60;
            break;
        }
      }

      return {
        ...prev,
        isRunning: true,
        timeRemaining,
        lastUpdateTime: Date.now(),
      };
    });

    // Disabled mini timer as it's causing issues
    setShowMiniTimer(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      timeRemaining: getTotalSeconds(prev.mode),
      isRunning: false,
    }));
  }, []);

  const skipTimer = useCallback(async () => {
    // If we're in work mode and timer is running, save as interrupted session
    if (
      timerState.mode === "work" &&
      timerState.isRunning &&
      !isDemoUser &&
      user
    ) {
      try {
        // Calculate elapsed time
        const totalSeconds = WORK_MINUTES * 60;
        const elapsedSeconds = totalSeconds - timerState.timeRemaining;
        const elapsedMinutes = Math.max(1, Math.floor(elapsedSeconds / 60)); // At least 1 minute

        // Calculate start time based on elapsed duration
        const endTime = new Date();
        const startTime = new Date(
          endTime.getTime() - elapsedMinutes * 60 * 1000
        );

        const sessionData = {
          task_name: timerState.currentTask?.name || "Unnamed Task",
          start_time: startTime,
          end_time: endTime,
          duration_minutes: elapsedMinutes,
          status: "interrupted" as const,
          notes: "Session skipped",
        };

        await createPomodoroSession(sessionData);

        // Update counts after successful save
        try {
          const counts = await getPomodoroCounts();
          setTodayCount(counts.today);
          setWeeklyCount(counts.week);
          setTotalCount(counts.total);
        } catch (error) {
          console.error("Failed to update Pomodoro counts:", error);
        }
      } catch (error) {
        console.error("Failed to save interrupted session:", error);
      }
    }

    // Reset timer to work mode
    setTimerState((prev) => {
      // If we're in break mode, keep the current task or get next from queue if no current task
      if (prev.mode === "shortBreak" || prev.mode === "longBreak") {
        // If we don't have a current task but have tasks in queue, get the next one
        if (!prev.currentTask && taskQueue.length > 0) {
          const nextTask = taskQueue[0];
          // Remove it from queue
          setTaskQueue((prevQueue) => prevQueue.slice(1));

          return {
            ...prev,
            mode: "work",
            timeRemaining: WORK_MINUTES * 60,
            isRunning: false,
            currentTask: nextTask,
          };
        }

        // Otherwise just reset the timer but keep the current task
        return {
          ...prev,
          mode: "work",
          timeRemaining: WORK_MINUTES * 60,
          isRunning: false,
        };
      }
      // If we're in work mode, just reset the timer
      else {
        return {
          ...prev,
          mode: "work",
          timeRemaining: WORK_MINUTES * 60,
          isRunning: false,
        };
      }
    });
  }, [
    timerState.mode,
    timerState.isRunning,
    timerState.timeRemaining,
    timerState.currentTask,
    taskQueue,
    isDemoUser,
    user,
  ]);

  // Task management
  const setCurrentTask = useCallback((task: PomodoroTask | null) => {
    setTimerState((prev) => ({ ...prev, currentTask: task }));
  }, []);

  const addTaskToQueue = useCallback((task: PomodoroTask) => {
    setTaskQueue((prev) => {
      // Limit queue to 8 tasks
      if (prev.length >= 8) {
        return prev;
      }
      return [...prev, task];
    });
  }, []);

  const removeTaskFromQueue = useCallback((taskId: string) => {
    setTaskQueue((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const reorderTaskQueue = useCallback(
    (startIndex: number, endIndex: number) => {
      setTaskQueue((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
      });
    },
    []
  );

  // Clear current task without completing it
  const clearCurrentTask = useCallback(() => {
    // Check if there are tasks in the queue
    if (taskQueue.length > 0) {
      // Get the first task from the queue
      const nextTask = taskQueue[0];

      // Remove it from the queue
      setTaskQueue((prev) => prev.slice(1));

      // Set it as the current task
      setTimerState((prev) => ({
        ...prev,
        currentTask: nextTask,
      }));
    } else {
      // If no tasks in queue, simply set the current task to null
      setTimerState((prev) => ({
        ...prev,
        currentTask: null,
      }));
    }
  }, [taskQueue]);

  const completeCurrentTask = useCallback(async () => {
    if (timerState.currentTask) {
      // Play completion sound
      if (timerCompleteSound.current) {
        try {
          timerCompleteSound.current.currentTime = 0;
          timerCompleteSound.current
            .play()
            .catch((e) => console.error("Error playing complete sound:", e));
        } catch (error) {
          console.error("Error playing complete sound:", error);
        }
      }

      // Mark task as completed in state
      setTimerState((prev) => ({
        ...prev,
        currentTask: prev.currentTask
          ? { ...prev.currentTask, completed: true }
          : null,
        isRunning: false, // Stop the timer
      }));

      // Save to database if not demo user
      if (!isDemoUser && user) {
        try {
          // Calculate actual time spent
          const totalSeconds = WORK_MINUTES * 60;
          const elapsedSeconds = totalSeconds - timerState.timeRemaining;
          // Convert to minutes, ensuring at least 1 minute
          const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));

          // Calculate start time based on actual elapsed time
          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - elapsedSeconds * 1000);

          const sessionData = {
            task_name: timerState.currentTask.name,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: durationMinutes,
            status: "completed" as const,
            notes: "Manually completed",
          };

          await createPomodoroSession(sessionData);

          // Update counts and streak after successful save
          try {
            const counts = await getPomodoroCounts();
            setTodayCount(counts.today);
            setWeeklyCount(counts.week);
            setTotalCount(counts.total);
          } catch (error) {
            console.error("Failed to update Pomodoro counts:", error);
          }

          // Update streak data
          try {
            const streakData = await getPomodoroStreak();
            setStreakCount(streakData.streak_count);
            setHasCompletedTodayPomodoro(streakData.has_completed_today);
          } catch (error) {
            console.error("Failed to update Pomodoro streak:", error);
          }
        } catch (error) {
          console.error("Failed to save completed task:", error);
        }
      }

      // Increment completed pomodoros
      const newCompletedPomodoros = timerState.completedPomodoros + 1;

      // Determine next break type
      const nextMode =
        newCompletedPomodoros % POMODOROS_UNTIL_LONG_BREAK === 0
          ? "longBreak"
          : "shortBreak";
      const nextTimeRemaining =
        nextMode === "longBreak"
          ? LONG_BREAK_MINUTES * 60
          : SHORT_BREAK_MINUTES * 60;

      // Start break timer
      setTimerState((prev) => ({
        ...prev,
        mode: nextMode,
        timeRemaining: nextTimeRemaining,
        isRunning: true, // Auto-start break
        completedPomodoros: newCompletedPomodoros,
      }));

      // After break, get next task from queue if available
      setTimeout(() => {
        // Clear the current task first
        setTimerState((prev) => ({
          ...prev,
          currentTask: null,
        }));

        // Then get the next task from queue if available
        if (taskQueue.length > 0) {
          const nextTask = taskQueue[0];
          setTaskQueue((prev) => prev.slice(1));

          setTimerState((prev) => ({
            ...prev,
            currentTask: nextTask,
          }));
        }
      }, 500);
    }
  }, [
    timerState.currentTask,
    timerState.completedPomodoros,
    isDemoUser,
    user,
    taskQueue,
    timerState.timeRemaining,
  ]);

  return (
    <PomodoroContext.Provider
      value={{
        // Timer state
        mode: timerState.mode,
        timeRemaining: timerState.timeRemaining,
        isRunning: timerState.isRunning,
        completedPomodoros: timerState.completedPomodoros,
        displayTime: formatTime(timerState.timeRemaining),
        progress: calculateProgress(),

        // Streak state (will be fetched from backend)
        streakCount,
        hasCompletedTodayPomodoro,

        // Counts
        todayCount,
        weeklyCount,
        totalCount,

        // Task state
        currentTask: timerState.currentTask,
        taskQueue,

        // Timer controls
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,

        // Task management
        setCurrentTask,
        addTaskToQueue,
        removeTaskFromQueue,
        reorderTaskQueue,
        completeCurrentTask,
        clearCurrentTask,

        // Mini timer
        showMiniTimer,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return context;
};
