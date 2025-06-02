/**
 * Time utility functions for the Life Dashboard application
 */

/**
 * Calculate the time remaining until midnight PST (America/Los_Angeles timezone)
 * @returns Object containing formatted time string and milliseconds remaining
 */
export const getTimeUntilMidnightPST = (): {
  timeRemaining: string;
  millisecondsRemaining: number;
} => {
  try {
    // Get current time in PST
    const now = new Date();
    const pstTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

    // Calculate next midnight in PST (start of next day)
    const nextMidnightPST = new Date(pstTime);
    nextMidnightPST.setDate(nextMidnightPST.getDate() + 1);
    nextMidnightPST.setHours(0, 0, 0, 0);

    // Calculate time difference (both times are in the same timezone context)
    const millisecondsRemaining = Math.max(
      0,
      nextMidnightPST.getTime() - pstTime.getTime()
    );

    // If no time remaining, return 00:00:00
    if (millisecondsRemaining <= 0) {
      return {
        timeRemaining: "00:00:00",
        millisecondsRemaining: 0,
      };
    }

    // Convert to hours, minutes, seconds
    const totalSeconds = Math.floor(millisecondsRemaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Ensure hours never exceed 23 (should be 0-23 range)
    const clampedHours = Math.min(hours, 23);

    // Format as HH:MM:SS
    const timeRemaining = `${clampedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return {
      timeRemaining,
      millisecondsRemaining,
    };
  } catch (error) {
    console.error("Error calculating time until midnight PST:", error);
    return {
      timeRemaining: "00:00:00",
      millisecondsRemaining: 0,
    };
  }
};

/**
 * Get the current date in PST timezone
 * @returns Date object representing today in PST
 */
export const getCurrentDatePST = (): Date => {
  try {
    const now = new Date();
    const pstTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );
    return pstTime;
  } catch (error) {
    console.error("Error getting current PST date:", error);
    return new Date();
  }
};

/**
 * Check if it's currently past midnight PST (new day)
 * @returns boolean indicating if it's a new day in PST
 */
export const isNewDayPST = (lastCheckTime: Date): boolean => {
  try {
    const currentPSTDate = getCurrentDatePST();
    const lastCheckPSTDate = new Date(
      lastCheckTime.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

    // Compare just the date parts (ignore time)
    return currentPSTDate.toDateString() !== lastCheckPSTDate.toDateString();
  } catch (error) {
    console.error("Error checking if new day PST:", error);
    return false;
  }
};

/**
 * Format a duration in milliseconds to HH:MM:SS format
 * @param milliseconds Duration in milliseconds
 * @returns Formatted time string
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds <= 0) return "00:00:00";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Get streak expiry message based on streak state with enhanced visual indicators
 * @param streakCount Current streak count
 * @param hasCompletedToday Whether user has completed a session today
 * @param timeRemaining Formatted time remaining until midnight
 * @returns Appropriate message for the streak state with emojis
 */
export const getStreakMessage = (
  streakCount: number,
  hasCompletedToday: boolean,
  timeRemaining: string
): string => {
  if (streakCount === 0) {
    return "Complete a Pomodoro to begin your streak";
  }

  if (hasCompletedToday) {
    return "Streak is safe for today!";
  }

  // For at-risk streaks, use warning emoji to make it more prominent
  return `Streak expires at midnight PST (${timeRemaining} remaining)`;
};

/**
 * Get the appropriate emoji for streak state
 * @param streakCount Current streak count
 * @param hasCompletedToday Whether user has completed a session today
 * @returns Emoji representing the streak state
 */
export const getStreakEmoji = (
  streakCount: number,
  hasCompletedToday: boolean
): string => {
  if (streakCount === 0) {
    return "🎯"; // Target emoji for starting a streak
  }

  if (hasCompletedToday) {
    return "✅"; // Check mark for safe streak
  }

  return "⚠️"; // Warning for at-risk streak
};

/**
 * Get streak status type for styling purposes
 * @param streakCount Current streak count
 * @param hasCompletedToday Whether user has completed a session today
 * @returns Status type: 'safe', 'at-risk', or 'none'
 */
export const getStreakStatus = (
  streakCount: number,
  hasCompletedToday: boolean
): "safe" | "at-risk" | "none" => {
  if (streakCount === 0) {
    return "none";
  }

  if (hasCompletedToday) {
    return "safe";
  }

  return "at-risk";
};

/**
 * Get CSS classes for streak status styling
 * @param streakCount Current streak count
 * @param hasCompletedToday Whether user has completed a session today
 * @returns Object with CSS classes for different elements
 */
export const getStreakStyling = (
  streakCount: number,
  hasCompletedToday: boolean
) => {
  const status = getStreakStatus(streakCount, hasCompletedToday);

  switch (status) {
    case "safe":
      return {
        containerClass: "bg-green-500/10 text-green-500 border-green-500/20",
        textClass: "text-green-500",
        bgClass: "bg-green-500/20",
        iconClass: "text-green-500",
      };
    case "at-risk":
      return {
        containerClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        textClass: "text-amber-500",
        bgClass: "bg-amber-500/20",
        iconClass: "text-amber-500",
      };
    case "none":
    default:
      return {
        containerClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        textClass: "text-blue-500",
        bgClass: "bg-blue-500/20",
        iconClass: "text-blue-500",
      };
  }
};

/**
 * Get the next midnight PST as a Date object
 * @returns Date object representing the next midnight in PST
 */
export const getNextMidnightPST = (): Date => {
  try {
    const now = new Date();
    const pstTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

    // Set to next midnight (start of next day)
    const nextMidnight = new Date(pstTime);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    return nextMidnight;
  } catch (error) {
    console.error("Error getting next midnight PST:", error);
    // Fallback: return tomorrow at midnight local time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
};
