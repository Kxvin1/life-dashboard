"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  getPomodoroSessions,
  PomodoroSession,
} from "@/services/pomodoroService";
import { useAuth } from "@/contexts/AuthContext";
import { usePomodoro } from "@/contexts/PomodoroContext";

const PomodoroHistory = () => {
  const { isDemoUser } = useAuth();
  const { streakCount, streakTimeRemaining, hasCompletedTodayPomodoro } =
    usePomodoro();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  // We're using the streak count from the context instead of the backend
  // const [backendStreakCount, setBackendStreakCount] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load sessions
  const loadSessions = useCallback(
    async (pageNum: number) => {
      if (isDemoUser) {
        // For demo users, return mock data
        const mockSessions: PomodoroSession[] = Array.from(
          { length: 10 },
          (_, i) => ({
            id: i,
            user_id: 0,
            task_name: `Demo Task ${i + 1}`,
            start_time: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
            end_time: new Date(Date.now() - i * 3600000).toISOString(),
            duration_minutes: 25,
            status: i % 3 === 0 ? "interrupted" : "completed",
            notes: i % 2 === 0 ? "Demo note" : undefined,
            created_at: new Date(Date.now() - i * 3600000).toISOString(),
          })
        );

        setSessions((prev) =>
          pageNum === 1 ? mockSessions : [...prev, ...mockSessions]
        );
        // We're using the streak count from the context instead
        // setBackendStreakCount(5); // Mock streak count
        setTotalCount(25); // Mock total count
        setHasMore(pageNum < 3); // Limit to 3 pages for demo
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getPomodoroSessions(pageNum, 10);

        setSessions((prev) =>
          pageNum === 1 ? response.items : [...prev, ...response.items]
        );
        // We're using the streak count from the context instead
        // setBackendStreakCount(response.streak_count);
        setTotalCount(response.total);
        setHasMore(response.has_more);
      } catch (err) {
        setError("Failed to load Pomodoro sessions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [isDemoUser]
  );

  // Initialize data
  useEffect(() => {
    loadSessions(1);
  }, [loadSessions]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();

    const callback = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    };

    observer.current = new IntersectionObserver(callback);

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }
  }, [loading, hasMore]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadSessions(page);
    }
  }, [page, loadSessions]);

  return (
    <div>
      {/* Streak display */}
      {streakCount > 0 ? (
        <div className="bg-orange-500/10 text-orange-500 p-4 rounded-md mb-6">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-3">🔥</span>
            <div className="flex-1">
              <p className="font-medium text-lg">
                {streakCount} Day{streakCount !== 1 ? "s" : ""} Streak
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Resets at midnight PST</p>
              <p className="text-lg font-mono">{streakTimeRemaining}</p>
            </div>
          </div>
          <div className="mt-2 bg-orange-500/20 p-2 rounded text-sm">
            <p className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {hasCompletedTodayPomodoro
                ? "✅ Streak is safe for today!"
                : "Complete at least one Pomodoro today to maintain your streak"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-500/10 text-blue-500 p-4 rounded-md mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🏆</span>
            <div>
              <p className="font-medium text-lg">Start Your Streak Today</p>
              <p className="text-sm mt-1">
                Complete a Pomodoro session to begin your productivity streak!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total sessions count */}
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Session History</h3>
        <div className="px-3 py-1 bg-primary/10 rounded-md">
          <span className="text-sm font-medium text-primary">
            {sessions.length > 0
              ? `Showing ${sessions.length} of ${totalCount} sessions in history`
              : "No sessions yet"}
          </span>
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
            {error}
          </div>
        )}

        {sessions.length === 0 && !loading && !error ? (
          <div className="bg-card p-4 rounded-md border border-border text-muted-foreground text-center">
            No Pomodoro sessions found. Complete your first session to see it
            here.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-card p-4 rounded-md border border-border"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {session.task_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(session.end_time)} at{" "}
                      {formatTime(session.end_time)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                      {session.duration_minutes}{" "}
                      {session.duration_minutes === 1 ? "minute" : "minutes"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {session.status === "completed"
                        ? "Completed"
                        : "Interrupted"}
                    </span>
                  </div>
                </div>
                {session.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {session.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            <div ref={loadingRef} className="py-4 text-center">
              {loading && (
                <p className="text-muted-foreground">
                  Loading more sessions...
                </p>
              )}
              {!hasMore && sessions.length > 0 && (
                <p className="text-muted-foreground">
                  No more sessions to load
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroHistory;
