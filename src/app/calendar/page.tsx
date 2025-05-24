"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data types
interface CalendarEvent {
  id: string;
  title: string;
  type: "transaction" | "task" | "subscription" | "pomodoro" | "holiday";
  date: string;
  color: string;
  metadata?: {
    amount?: number;
    daysUntilRenewal?: number;
    completionRate?: number;
    streak?: number;
    priority?: string;
  };
}

// Mock events for December 2025
const mockEvents: CalendarEvent[] = [
  // Official Holidays
  {
    id: "h1",
    title: "🎄 Christmas Day",
    type: "holiday",
    date: "2025-12-25",
    color: "bg-emerald-600",
  },
  {
    id: "h2",
    title: "🎆 New Year's Eve",
    type: "holiday",
    date: "2025-12-31",
    color: "bg-emerald-600",
  },
  {
    id: "h3",
    title: "🎁 Christmas Eve",
    type: "holiday",
    date: "2025-12-24",
    color: "bg-emerald-600",
  },

  // Transactions
  {
    id: "1",
    title: "💰 Salary",
    type: "transaction",
    date: "2025-12-01",
    color: "bg-green-500",
    metadata: { amount: 5200 },
  },
  {
    id: "2",
    title: "🛒 Groceries",
    type: "transaction",
    date: "2025-12-08",
    color: "bg-red-500",
    metadata: { amount: -127.5 },
  },
  {
    id: "4",
    title: "💼 Freelance",
    type: "transaction",
    date: "2025-12-15",
    color: "bg-green-500",
    metadata: { amount: 850 },
  },
  {
    id: "6",
    title: "🍽️ Dinner Out",
    type: "transaction",
    date: "2025-12-20",
    color: "bg-red-500",
    metadata: { amount: -89.25 },
  },
  {
    id: "24",
    title: "🎁 Gift Shopping",
    type: "transaction",
    date: "2025-12-23",
    color: "bg-red-500",
    metadata: { amount: -245.8 },
  },
  {
    id: "25",
    title: "💰 Bonus Payment",
    type: "transaction",
    date: "2025-12-27",
    color: "bg-green-500",
    metadata: { amount: 120000 },
  },

  // Tasks
  {
    id: "8",
    title: "🚨 Project Deadline",
    type: "task",
    date: "2025-12-06",
    color: "bg-orange-600",
    metadata: { priority: "high", completionRate: 85 },
  },
  {
    id: "10",
    title: "👥 Team Meeting",
    type: "task",
    date: "2025-12-11",
    color: "bg-blue-500",
    metadata: { priority: "low", completionRate: 100 },
  },
  {
    id: "12",
    title: "🎄 Christmas Shopping",
    type: "task",
    date: "2025-12-18",
    color: "bg-blue-500",
    metadata: { priority: "low", completionRate: 60 },
  },
  {
    id: "13",
    title: "📊 Year-end Report",
    type: "task",
    date: "2025-12-30",
    color: "bg-orange-600",
    metadata: { priority: "high", completionRate: 25 },
  },

  // Subscriptions
  {
    id: "14",
    title: "🎬 Netflix",
    type: "subscription",
    date: "2025-12-05",
    color: "bg-purple-500",
    metadata: { amount: -15.99, daysUntilRenewal: 5 },
  },
  {
    id: "16",
    title: "💪 Gym",
    type: "subscription",
    date: "2025-12-15",
    color: "bg-purple-500",
    metadata: { amount: -49.99, daysUntilRenewal: 15 },
  },
  {
    id: "30",
    title: "☕ Coffee Meeting",
    type: "transaction",
    date: "2025-12-15",
    color: "bg-red-500",
    metadata: { amount: -12.5 },
  },
  {
    id: "31",
    title: "📝 Client Call",
    type: "task",
    date: "2025-12-15",
    color: "bg-yellow-500",
    metadata: { priority: "medium", completionRate: 90 },
  },
  {
    id: "32",
    title: "🎨 Design Review",
    type: "pomodoro",
    date: "2025-12-15",
    color: "bg-amber-500",
    metadata: { streak: 4 },
  },
  {
    id: "27",
    title: "📱 Phone Plan",
    type: "subscription",
    date: "2025-12-28",
    color: "bg-purple-500",
    metadata: { amount: -85.0, daysUntilRenewal: 28 },
  },

  // Pomodoro Sessions
  {
    id: "18",
    title: "📚 Study Session",
    type: "pomodoro",
    date: "2025-12-02",
    color: "bg-amber-500",
    metadata: { streak: 3 },
  },
  {
    id: "20",
    title: "⚛️ Learning React",
    type: "pomodoro",
    date: "2025-12-09",
    color: "bg-amber-500",
    metadata: { streak: 7 },
  },
  {
    id: "22",
    title: "🎨 Design Work",
    type: "pomodoro",
    date: "2025-12-16",
    color: "bg-amber-500",
    metadata: { streak: 12 },
  },
  {
    id: "29",
    title: "🧘 Meditation",
    type: "pomodoro",
    date: "2025-12-29",
    color: "bg-amber-500",
    metadata: { streak: 5 },
  },
];

const CalendarPreview = () => {
  const [currentDate] = useState(new Date(2025, 11, 1)); // December 2025

  // Get calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const current = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return mockEvents.filter((event) => event.date === dateStr);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="min-h-screen p-4 bg-background">
      {/* Preview Banner */}
      <div className="p-6 mb-6 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-xl font-bold text-blue-900 dark:text-blue-100">
              📅 Calendar Feature Preview
            </h2>
            <p className="mb-1 text-sm text-blue-700 dark:text-blue-300">
              This is a preview of how your integrated calendar will look when
              implemented. Showing December 2025 with holidays and sample data.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              ✨ All your Life Dashboard data unified in one beautiful calendar
              interface
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="p-6 mb-6 border shadow-md bg-card rounded-xl border-border">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {monthNames[month]} {year}
          </h1>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-secondary text-foreground hover:bg-secondary/80">
              ← Prev
            </button>
            <button className="px-3 py-1 text-white rounded bg-primary hover:bg-primary/90">
              Today
            </button>
            <button className="px-3 py-1 rounded bg-secondary text-foreground hover:bg-secondary/80">
              Next →
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Event Types
          </h3>
          <div className="grid grid-cols-2 gap-3 p-4 rounded-lg md:grid-cols-4 lg:grid-cols-8 bg-secondary/30">
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 rounded-full shadow-sm bg-emerald-600"></div>
              <span className="text-xs font-medium text-foreground">
                Holidays
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-foreground">
                Income
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-foreground">
                Expenses
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-foreground">
                Subscriptions
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 rounded-full shadow-sm bg-amber-500"></div>
              <span className="text-xs font-medium text-foreground">
                Pomodoro
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 bg-orange-600 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-foreground">
                High Priority
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-foreground">
                Medium Priority
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-white/50 dark:bg-gray-800/50">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-foreground">
                Low Priority
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 font-medium text-center text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const events = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-border/50 ${
                  isCurrentMonth ? "bg-card" : "bg-muted/30"
                } ${
                  isToday ? "ring-2 ring-primary" : ""
                } hover:bg-secondary/50 transition-colors`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-[15px] px-2 py-1 rounded text-white truncate ${event.color} hover:opacity-80 cursor-pointer relative group`}
                      title={`${event.title} (${event.type})`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{event.title}</span>
                        {/* Mini transaction amounts only */}
                        {event.metadata?.amount && (
                          <span className="text-[10px] ml-1 opacity-90">
                            {event.metadata.amount > 0 ? "+" : ""}$
                            {Math.abs(event.metadata.amount).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Enhanced Tooltip */}
                      <div className="absolute left-0 z-10 hidden mb-2 bottom-full group-hover:block">
                        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
                          <div className="mb-1 font-medium">{event.title}</div>
                          <div className="mb-2 text-gray-300 capitalize">
                            {event.type}
                          </div>
                          {event.metadata?.amount && (
                            <div className="text-gray-300">
                              Amount:{" "}
                              <span
                                className={
                                  event.metadata.amount > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {event.metadata.amount > 0 ? "+" : ""}$
                                {Math.abs(
                                  event.metadata.amount
                                ).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {event.metadata?.completionRate !== undefined && (
                            <div className="text-gray-300">
                              Progress:{" "}
                              <span className="text-blue-400">
                                {event.metadata.completionRate}%
                              </span>
                            </div>
                          )}
                          {event.metadata?.streak && (
                            <div className="text-gray-300">
                              Streak:{" "}
                              <span className="text-orange-400">
                                {event.metadata.streak} days
                              </span>
                            </div>
                          )}
                          {event.metadata?.daysUntilRenewal && (
                            <div className="text-gray-300">
                              Renews in:{" "}
                              <span className="text-purple-400">
                                {event.metadata.daysUntilRenewal} days
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="px-2 py-1 text-sm rounded cursor-pointer text-muted-foreground bg-secondary/50 hover:bg-secondary/70">
                      +{events.length - 3} more events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Features */}
      <div className="p-6 mb-6 border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl dark:border-purple-800">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          🎯 Key Features
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg dark:bg-purple-900/50">
              <span className="text-purple-600 dark:text-purple-400">🔄</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">
                Unified Data
              </h4>
              <p className="text-xs text-muted-foreground">
                All your Life Dashboard features in one view
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg dark:bg-blue-900/50">
              <span className="text-blue-600 dark:text-blue-400">🎨</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">
                Modern Design
              </h4>
              <p className="text-xs text-muted-foreground">
                Intelligent color-coding with seamless holiday integration and
                performance insights
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg dark:bg-green-900/50">
              <span className="text-green-600 dark:text-green-400">⚡</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">
                Real-time Sync
              </h4>
              <p className="text-xs text-muted-foreground">
                Updates instantly when you add new data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="p-6 border shadow-md bg-card rounded-xl border-border">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          🚀 Coming Features
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              🤖 AI Integration
            </h4>
            <p className="text-sm text-muted-foreground">
              Smart insights and predictions based on your calendar patterns and
              spending habits
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              🔍 Smart Filters
            </h4>
            <p className="text-sm text-muted-foreground">
              Filter by event type, priority, or date range
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">📊 Analytics</h4>
            <p className="text-sm text-muted-foreground">
              Insights into your productivity and spending patterns
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">🔔 Reminders</h4>
            <p className="text-sm text-muted-foreground">
              Smart notifications for upcoming tasks and payments
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              📅 Multiple Views
            </h4>
            <p className="text-sm text-muted-foreground">
              Month, week, and day views for different perspectives
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              🎯 Quick Actions
            </h4>
            <p className="text-sm text-muted-foreground">
              Add events directly from calendar interface
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              🔗 Cross-Feature Navigation
            </h4>
            <p className="text-sm text-muted-foreground">
              Click any event to jump directly to the source feature for editing
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              📊 Smart Insights
            </h4>
            <p className="text-sm text-muted-foreground">
              Visualize patterns between productivity, spending, and life events
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <h4 className="mb-2 font-medium text-foreground">
              🎨 Customizable Themes
            </h4>
            <p className="text-sm text-muted-foreground">
              Personalize colors, layouts, and event display preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPreview;
