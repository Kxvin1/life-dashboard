"use client";

import { useEffect, useRef, useState } from "react";
import {
  getInsightHistory,
  getInsightById,
  AIInsightHistoryItem,
} from "@/services/aiInsightService";
import AIInsightsModal from "./AIInsightsModal";

interface AIInsightsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIInsightsHistoryModal({
  isOpen,
  onClose,
}: AIInsightsHistoryModalProps) {
  const [history, setHistory] = useState<AIInsightHistoryItem[]>([]);
  const [selectedInsight, setSelectedInsight] =
    useState<AIInsightHistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load history when modal opens and reset selected insight
  useEffect(() => {
    if (isOpen) {
      // Reset selected insight when opening the modal
      setSelectedInsight(null);
      setLoading(true);
      setError(null);

      getInsightHistory()
        .then((data) => {
          setHistory(data);
        })
        .catch((err) => {
          setError(err.message || "Failed to load history");
          console.error("Failed to load history:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleViewInsight = async (insight: AIInsightHistoryItem) => {
    try {
      setLoading(true);
      setError(null);

      // Get the full insight details
      const fullInsight = await getInsightById(insight.id);
      setSelectedInsight(fullInsight);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load insight details");
      }
      console.error("Failed to load insight details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format time period for display
  const formatTimePeriod = (period: string) => {
    switch (period) {
      case "month":
        return "Current Month";
      case "prev_month":
        return "Previous Month";
      case "year":
        return "Current Year";
      case "prev_year":
        return "Previous Year";
      case "all":
        return "All Time";
      default:
        return period;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            AI Insights History
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>Error loading insights: {error}</p>
            <button
              onClick={() =>
                getInsightHistory()
                  .then(setHistory)
                  .catch((err) => setError(err.message))
              }
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No AI insights history found.</p>
            <p className="mt-2">Generate insights to see them here.</p>
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
                      {formatTimePeriod(item.time_period)} Analysis
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
          </div>
        )}
      </div>

      {selectedInsight && (
        <AIInsightsModal
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          data={{
            summary: selectedInsight.summary,
            insights: selectedInsight.insights,
            recommendations: selectedInsight.recommendations,
            charts: selectedInsight.charts_data,
            remaining_uses: 0,
            total_uses_allowed: 0,
          }}
          selectedTimePeriod={selectedInsight.time_period}
        />
      )}
    </div>
  );
}
