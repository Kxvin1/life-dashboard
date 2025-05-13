"use client";

import { useState, useEffect } from "react";
import {
  getAIInsights,
  getRemainingInsights,
} from "@/services/aiInsightService";
import AIInsightsModal from "./AIInsightsModal";
import AIInsightsHistoryModal from "./AIInsightsHistoryModal";

interface AIInsightsButtonProps {
  timePeriod?: string;
}

// Helper function to format time period for display
const formatTimePeriod = (period: string): string => {
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

export default function AIInsightsButton({
  timePeriod = "all",
}: AIInsightsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [insightData, setInsightData] = useState<any>(null);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  const [totalAllowed, setTotalAllowed] = useState<number | null>(null);
  // Initialize with the prop
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<string>(timePeriod);

  // Update selectedTimePeriod when the prop changes
  useEffect(() => {
    setSelectedTimePeriod(timePeriod);
  }, [timePeriod]);

  const fetchRemainingUses = async () => {
    try {
      const data = await getRemainingInsights();
      setRemainingUses(data.remaining_uses);
      setTotalAllowed(data.total_uses_allowed);
    } catch (err) {
      console.error("Failed to fetch remaining uses:", err);
    }
  };

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get AI insights using the selected time period
      const data = await getAIInsights(selectedTimePeriod);
      setInsightData(data);
      setRemainingUses(data.remaining_uses);
      setTotalAllowed(data.total_uses_allowed);

      // History is saved on the backend

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

  // Handle time period selection
  const handleTimePeriodSelect = (period: string) => {
    setSelectedTimePeriod(period);
  };

  const handleHistoryClick = () => {
    setIsHistoryModalOpen(true);
  };

  // Fetch remaining uses on initial render
  if (remainingUses === null) {
    fetchRemainingUses();
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap justify-center gap-2 mb-2">
        {/* Time Period Dropdown */}
        <div className="relative">
          <select
            value={selectedTimePeriod}
            onChange={(e) => handleTimePeriodSelect(e.target.value)}
            className="flex items-center justify-center gap-2 px-4 py-2 pr-8 font-medium transition-colors rounded-lg appearance-none bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <option value="month">Current Month</option>
            <option value="prev_month">Previous Month</option>
            <option value="year">Current Year</option>
            <option value="prev_year">Previous Year</option>
            <option value="all">All Time</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="w-4 h-4 text-secondary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>

        {/* AI Insights Button */}
        <button
          onClick={handleClick}
          disabled={loading || (remainingUses !== null && remainingUses <= 0)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            loading
              ? "bg-secondary text-muted-foreground cursor-not-allowed"
              : remainingUses !== null && remainingUses <= 0
              ? "bg-secondary text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
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

        {/* History Button */}
        <button
          onClick={handleHistoryClick}
          className="flex items-center justify-center gap-2 px-4 py-2 font-medium transition-colors rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
          <span>History</span>
        </button>
      </div>

      {remainingUses !== null && totalAllowed !== null && (
        <div className="mt-1 text-xs text-muted-foreground">
          {remainingUses > 0
            ? `${remainingUses} of ${totalAllowed} uses remaining today`
            : "No uses remaining today"}
        </div>
      )}

      {error && (
        <div className="p-3 mt-2 text-sm border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
          <div className="mb-1 font-medium">Error:</div>
          <div>{error}</div>
        </div>
      )}

      {isModalOpen && insightData && (
        <AIInsightsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={insightData}
          selectedTimePeriod={selectedTimePeriod}
        />
      )}

      <AIInsightsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}
