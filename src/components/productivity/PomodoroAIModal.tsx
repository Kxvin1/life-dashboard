"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

interface PomodoroAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    summary: string;
    insights: string[];
    recommendations: string[];
    charts: {
      daily_chart: {
        labels: string[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor: string;
          borderColor: string;
          borderWidth: number;
        }[];
      };
      completion_chart: {
        labels: string[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor: string;
          borderColor: string;
          borderWidth: number;
        }[];
      };
      time_of_day_chart: {
        labels: number[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor: string;
          borderColor: string;
          borderWidth: number;
        }[];
      };
    };
    remaining_uses: number;
    total_uses_allowed: number;
  };
}

const PomodoroAIModal = ({ isOpen, onClose, data }: PomodoroAIModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const dailyChartRef = useRef<HTMLCanvasElement>(null);
  const completionChartRef = useRef<HTMLCanvasElement>(null);
  const timeOfDayChartRef = useRef<HTMLCanvasElement>(null);

  const dailyChartInstance = useRef<Chart | null>(null);
  const completionChartInstance = useRef<Chart | null>(null);
  const timeOfDayChartInstance = useRef<Chart | null>(null);

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

  // Initialize charts
  useEffect(() => {
    if (!isOpen) return;

    // Destroy existing charts
    if (dailyChartInstance.current) {
      dailyChartInstance.current.destroy();
    }
    if (completionChartInstance.current) {
      completionChartInstance.current.destroy();
    }
    if (timeOfDayChartInstance.current) {
      timeOfDayChartInstance.current.destroy();
    }

    // Common chart options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: 10,
          titleFont: {
            size: 14,
          },
          bodyFont: {
            size: 13,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(100, 116, 139, 0.1)",
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(100, 116, 139, 0.1)",
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
      },
    };

    // Create daily chart
    if (dailyChartRef.current) {
      const ctx = dailyChartRef.current.getContext("2d");
      if (ctx) {
        dailyChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: data.charts.daily_chart,
          options: commonOptions,
        });
      }
    }

    // Create completion chart
    if (completionChartRef.current) {
      const ctx = completionChartRef.current.getContext("2d");
      if (ctx) {
        completionChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: data.charts.completion_chart,
          options: commonOptions,
        });
      }
    }

    // Create time of day chart
    if (timeOfDayChartRef.current) {
      const ctx = timeOfDayChartRef.current.getContext("2d");
      if (ctx) {
        // Format hour labels
        const hourLabels = data.charts.time_of_day_chart.labels.map((hour) => {
          return `${hour}:00`;
        });

        const chartData = {
          ...data.charts.time_of_day_chart,
          labels: hourLabels,
        };

        timeOfDayChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: chartData,
          options: commonOptions,
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (dailyChartInstance.current) {
        dailyChartInstance.current.destroy();
      }
      if (completionChartInstance.current) {
        completionChartInstance.current.destroy();
      }
      if (timeOfDayChartInstance.current) {
        timeOfDayChartInstance.current.destroy();
      }
    };
  }, [isOpen, data]);

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
              AI Productivity Analysis
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Based on your recent Pomodoro sessions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
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
            <div className="bg-card/50 border border-border rounded-lg p-4">
              <h4 className="text-lg font-medium text-foreground mb-2">
                Daily Pomodoro Minutes
              </h4>
              <div className="h-64">
                <canvas ref={dailyChartRef} />
              </div>
            </div>

            <div className="bg-card/50 border border-border rounded-lg p-4">
              <h4 className="text-lg font-medium text-foreground mb-2">
                Completed vs Interrupted Sessions
              </h4>
              <div className="h-64">
                <canvas ref={completionChartRef} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Interrupted sessions are those stopped before completion or
                  skipped
                </span>
              </div>
            </div>

            <div className="bg-card/50 border border-border rounded-lg p-4 col-span-1 md:col-span-2">
              <h4 className="text-lg font-medium text-foreground mb-2">
                Sessions by Time of Day
              </h4>
              <div className="h-64">
                <canvas ref={timeOfDayChartRef} />
              </div>
            </div>
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
};

export default PomodoroAIModal;
