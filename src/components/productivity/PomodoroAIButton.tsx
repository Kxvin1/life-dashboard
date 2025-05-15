"use client";

import { useState, useEffect } from "react";
import {
  analyzePomodoroSessions,
  getRemainingPomodoroAIUses,
  getPomodoroSessions,
  PomodoroAIResponse,
} from "@/services/pomodoroService";
import PomodoroModalsPortal from "@/components/productivity/PomodoroModalsPortal";
import { useAuth } from "@/contexts/AuthContext";

const PomodoroAIButton = () => {
  const { isDemoUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [insightData, setInsightData] = useState<PomodoroAIResponse | null>(
    null
  );
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  const [totalAllowed, setTotalAllowed] = useState<number | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const MIN_SESSIONS_REQUIRED = 5;

  // Fetch remaining uses
  const fetchRemainingUses = async () => {
    try {
      const data = await getRemainingPomodoroAIUses();
      setRemainingUses(data.remaining_uses);
      setTotalAllowed(data.total_uses_allowed);
    } catch (err) {
      console.error("Failed to fetch remaining uses:", err);
    }
  };

  // Fetch session count
  const fetchSessionCount = async () => {
    try {
      const data = await getPomodoroSessions(1, 1); // Just get the first page with 1 item to get total count
      setSessionCount(data.total);
    } catch (err) {
      console.error("Failed to fetch session count:", err);
      setSessionCount(0);
    }
  };

  // Handle button click
  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user has enough sessions
      if (sessionCount < MIN_SESSIONS_REQUIRED) {
        throw new Error(
          `You need at least ${MIN_SESSIONS_REQUIRED} Pomodoro sessions to generate insights.`
        );
      }

      // Get AI insights
      const data = await analyzePomodoroSessions();
      setInsightData(data);
      setRemainingUses(data.remaining_uses);
      setTotalAllowed(data.total_uses_allowed);

      setIsModalOpen(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial render
  useEffect(() => {
    fetchRemainingUses();
    fetchSessionCount();
  }, []);

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {/* AI Insights Button */}
          <div className="relative group">
            <button
              onClick={handleClick}
              disabled={
                loading ||
                isDemoUser ||
                (remainingUses !== null && remainingUses <= 0) ||
                sessionCount < MIN_SESSIONS_REQUIRED
              }
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                loading ||
                isDemoUser ||
                (remainingUses !== null && remainingUses <= 0) ||
                sessionCount < MIN_SESSIONS_REQUIRED
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
              aria-label="Generate AI productivity insights"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current rounded-full animate-spin border-t-transparent"></span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
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
                    className="lucide lucide-sparkles"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                    <path d="M3 5h4" />
                    <path d="M17 19h4" />
                  </svg>
                  <span>Generate Insights</span>
                </>
              )}
            </button>

            {/* Tooltip for demo mode */}
            {isDemoUser && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                <div className="font-medium mb-1">
                  AI Analysis Unavailable in Demo Mode
                </div>
                <p>
                  AI Productivity Analysis is not available in demo mode. Sign
                  up for a full account to access this feature.
                </p>
              </div>
            )}

            {/* Tooltip for session requirements */}
            {!isDemoUser && sessionCount < MIN_SESSIONS_REQUIRED && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                <div className="font-medium mb-1">Not Enough Sessions</div>
                <p>
                  You need at least {MIN_SESSIONS_REQUIRED} Pomodoro sessions to
                  generate insights. You currently have {sessionCount}{" "}
                  {sessionCount === 1 ? "session" : "sessions"}.
                </p>
              </div>
            )}
          </div>

          {/* History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            disabled={isDemoUser}
            className={`flex items-center justify-center gap-2 px-4 py-2 font-medium transition-colors rounded-lg ${
              isDemoUser
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            aria-label="View AI analysis history"
          >
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
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>View History</span>
          </button>
        </div>

        {/* Status message */}
        <div className="mt-1 text-xs text-muted-foreground">
          {isDemoUser
            ? "AI Productivity Analysis is not available in demo mode"
            : sessionCount < MIN_SESSIONS_REQUIRED
            ? `Need at least ${MIN_SESSIONS_REQUIRED} sessions (you have ${sessionCount})`
            : remainingUses !== null && totalAllowed !== null
            ? remainingUses > 0
              ? `${remainingUses} of ${totalAllowed} uses remaining today`
              : "No uses remaining today"
            : "Loading..."}
        </div>

        {error && (
          <div className="p-3 mt-2 text-sm border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
            <div className="mb-1 font-medium">Error:</div>
            <div>{error}</div>
          </div>
        )}
      </div>

      <PomodoroModalsPortal
        insightsModalOpen={isModalOpen}
        historyModalOpen={isHistoryModalOpen}
        insightData={insightData}
        onInsightsClose={() => setIsModalOpen(false)}
        onHistoryClose={() => setIsHistoryModalOpen(false)}
      />
    </>
  );
};

export default PomodoroAIButton;
