import { useState, useEffect, useRef } from "react";
import { getTimeUntilMidnightPST, getStreakMessage } from "@/utils/timeUtils";

interface UseStreakCountdownProps {
  streakCount: number;
  hasCompletedTodayPomodoro: boolean;
}

interface UseStreakCountdownReturn {
  timeRemaining: string;
  streakMessage: string;
  isCountdownActive: boolean;
}

/**
 * Custom hook for managing Pomodoro streak countdown timer
 * 
 * This hook manages the countdown timer that shows time remaining until midnight PST
 * when the user has an active streak but hasn't completed a Pomodoro today.
 * 
 * @param streakCount - Current streak count
 * @param hasCompletedTodayPomodoro - Whether user has completed a session today
 * @returns Object containing time remaining, streak message, and countdown status
 */
export const useStreakCountdown = ({
  streakCount,
  hasCompletedTodayPomodoro,
}: UseStreakCountdownProps): UseStreakCountdownReturn => {
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");
  const [streakMessage, setStreakMessage] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if countdown should be active
  const isCountdownActive = streakCount > 0 && !hasCompletedTodayPomodoro;

  // Function to update the countdown
  const updateCountdown = () => {
    try {
      const { timeRemaining: newTimeRemaining } = getTimeUntilMidnightPST();
      setTimeRemaining(newTimeRemaining);

      // Update streak message based on current state
      const newMessage = getStreakMessage(
        streakCount,
        hasCompletedTodayPomodoro,
        newTimeRemaining
      );
      setStreakMessage(newMessage);
    } catch (error) {
      console.error("Error updating countdown:", error);
      setTimeRemaining("00:00:00");
      setStreakMessage("Error calculating countdown");
    }
  };

  // Effect to manage the countdown timer
  useEffect(() => {
    // Always update immediately when dependencies change
    updateCountdown();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start interval if countdown should be active
    if (isCountdownActive) {
      // Update every second
      intervalRef.current = setInterval(updateCountdown, 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [streakCount, hasCompletedTodayPomodoro, isCountdownActive]);

  // Effect to handle component unmount cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Effect to handle visibility change (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isCountdownActive) {
        // Update immediately when tab becomes visible
        updateCountdown();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isCountdownActive]);

  return {
    timeRemaining,
    streakMessage,
    isCountdownActive,
  };
};

/**
 * Simplified hook for just getting the current time until midnight PST
 * Useful for components that only need the time remaining without full streak logic
 */
export const useTimeUntilMidnight = (): string => {
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      try {
        const { timeRemaining: newTimeRemaining } = getTimeUntilMidnightPST();
        setTimeRemaining(newTimeRemaining);
      } catch (error) {
        console.error("Error updating time until midnight:", error);
        setTimeRemaining("00:00:00");
      }
    };

    // Update immediately
    updateTime();

    // Update every second
    intervalRef.current = setInterval(updateTime, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const { timeRemaining: newTimeRemaining } = getTimeUntilMidnightPST();
        setTimeRemaining(newTimeRemaining);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return timeRemaining;
};
