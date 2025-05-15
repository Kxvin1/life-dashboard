"use client";

import { useEffect, useRef, useState } from "react";
import {
  getPomodoroAIHistory,
  getPomodoroAIHistoryById,
  getRemainingPomodoroAIUses,
  PomodoroAIHistoryItem,
} from "@/services/pomodoroService";
import PomodoroAIModal from "./PomodoroAIModal";

interface PomodoroAIHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function PomodoroAIHistoryModal({
  isOpen,
  onClose,
}: PomodoroAIHistoryModalProps) {
  const [history, setHistory] = useState<PomodoroAIHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInsight, setSelectedInsight] = useState<any | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore]);

  // Load history when modal opens or search term changes
  useEffect(() => {
    if (isOpen) {
      // Reset selected insight and pagination when opening the modal
      setSelectedInsight(null);
      setPage(0);
      setHasMore(true);
      setHistory([]);

      // Only load if search term is empty or at least 3 characters
      if (searchTerm.length === 0 || searchTerm.length >= 3) {
        loadHistory(0);
      }
    }
  }, [isOpen, searchTerm]);

  // Load history when page changes
  useEffect(() => {
    if (page > 0 && hasMore) {
      loadHistory(page);
    }
  }, [page]);

  // Function to load history with pagination and search
  const loadHistory = (pageNum: number) => {
    setLoading(true);
    setError(null);

    const skip = pageNum * ITEMS_PER_PAGE;

    getPomodoroAIHistory(skip, ITEMS_PER_PAGE)
      .then((data) => {
        // Filter data based on search term if provided
        let filteredData = data;
        if (searchTerm.trim().length >= 3) {
          const searchLower = searchTerm.toLowerCase();
          filteredData = data.filter(
            (item) =>
              item.summary.toLowerCase().includes(searchLower) ||
              item.insights.some((insight) =>
                insight.toLowerCase().includes(searchLower)
              ) ||
              item.recommendations.some((rec) =>
                rec.toLowerCase().includes(searchLower)
              )
          );
        }

        if (pageNum === 0) {
          // First page, replace history
          setHistory(filteredData);
        } else {
          // Subsequent pages, append to history
          setHistory((prev) => [...prev, ...filteredData]);
        }

        // Check if there are more items to load
        setHasMore(filteredData.length === ITEMS_PER_PAGE);
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
        // Don't show error to user, just set empty history
        setHistory([]);
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleViewInsight = async (insight: PomodoroAIHistoryItem) => {
    try {
      // Clear any previous insight data first
      setSelectedInsight(null);

      setLoading(true);
      setError(null);

      // Get the full insight details
      const fullInsight = await getPomodoroAIHistoryById(insight.id);

      // Get the current remaining uses
      try {
        const remainingData = await getRemainingPomodoroAIUses();
        fullInsight.remaining_uses = remainingData.remaining_uses;
        fullInsight.total_uses_allowed = remainingData.total_uses_allowed;
      } catch (error) {
        console.error("Failed to fetch remaining uses:", error);
        // Continue even if this fails
      }

      // Set the selected insight after a small delay to ensure clean rendering
      setTimeout(() => {
        setSelectedInsight(fullInsight);
      }, 50);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load insight details");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col m-auto">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">
              Productivity Analysis History
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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

          <div className="p-4 border-b border-border">
            <input
              type="text"
              placeholder="Search insights..."
              className="w-full p-2 rounded-md border border-border bg-background text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={() => loadHistory(0)}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Analysis History Yet
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Generate your first productivity analysis to see insights
                  about your Pomodoro sessions. Your analysis history will
                  appear here.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Got it
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card/50 border border-border rounded-lg p-4 hover:bg-accent/10 transition-colors cursor-pointer"
                    onClick={() => handleViewInsight(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-foreground">
                          Productivity Analysis
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <button
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInsight(item);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                ))}

                {/* Loading indicator for infinite scroll */}
                {hasMore && (
                  <div
                    ref={loadingRef}
                    className="py-4 text-center text-muted-foreground"
                  >
                    {loading ? "Loading more..." : "Scroll for more"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the PomodoroAIModal outside the main modal */}
      {selectedInsight && (
        <PomodoroAIModal
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          data={{
            summary: selectedInsight.summary,
            insights: selectedInsight.insights,
            recommendations: selectedInsight.recommendations,
            charts: selectedInsight.charts_data,
            remaining_uses: selectedInsight.remaining_uses || 0,
            total_uses_allowed: selectedInsight.total_uses_allowed || 0,
          }}
        />
      )}
    </>
  );
}
