"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import { AIInsightResponse } from "@/services/aiInsightService";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AIInsightResponse;
  selectedTimePeriod?: string;
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

export default function AIInsightsModal({
  isOpen,
  onClose,
  data,
  selectedTimePeriod = "year",
}: AIInsightsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        ref={modalRef}
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 m-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              AI Financial Analysis
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Analysis Period:{" "}
              {formatTimePeriod(data.time_period || selectedTimePeriod)}
            </p>
          </div>
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

        <div className="space-y-8">
          {/* Summary Section */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Summary
            </h3>
            <p className="text-muted-foreground">{data.summary}</p>
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.charts.categoryDistribution && (
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Expense Categories
                </h4>
                <div className="h-64">
                  <Pie
                    data={data.charts.categoryDistribution}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>
            )}

            {data.charts.incomeVsExpenses && (
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Income vs Expenses
                </h4>
                <div className="h-64">
                  <Bar
                    data={data.charts.incomeVsExpenses}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {data.charts.spendingTrends && (
              <div className="bg-card/50 border border-border rounded-lg p-4 col-span-1 md:col-span-2">
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Spending Trends
                </h4>
                <div className="h-64">
                  <Line
                    data={data.charts.spendingTrends}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Insights Section */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Key Insights
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {data.insights.map((insight, index) => (
                <li key={index} className="text-muted-foreground">
                  {insight}
                </li>
              ))}
            </ul>
          </section>

          {/* Recommendations Section */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Recommendations
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="text-muted-foreground">
                  {recommendation}
                </li>
              ))}
            </ul>
          </section>

          {/* Usage Info */}
          <section className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <p>
              {data.remaining_uses > 0
                ? `You have ${data.remaining_uses} of ${data.total_uses_allowed} AI insights remaining today.`
                : "You have used all your AI insights for today."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
