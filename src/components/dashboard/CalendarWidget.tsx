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
}

// Mock events matching the calendar preview page exactly
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
  },
  {
    id: "2",
    title: "🛒 Groceries",
    type: "transaction",
    date: "2025-12-08",
    color: "bg-red-500",
  },
  {
    id: "4",
    title: "💼 Freelance",
    type: "transaction",
    date: "2025-12-15",
    color: "bg-green-500",
  },
  {
    id: "6",
    title: "🍽️ Dinner Out",
    type: "transaction",
    date: "2025-12-20",
    color: "bg-red-500",
  },
  {
    id: "24",
    title: "🎁 Gift Shopping",
    type: "transaction",
    date: "2025-12-23",
    color: "bg-red-500",
  },

  // Tasks
  {
    id: "8",
    title: "🚨 Project Deadline",
    type: "task",
    date: "2025-12-06",
    color: "bg-orange-600",
  },
  {
    id: "10",
    title: "👥 Team Meeting",
    type: "task",
    date: "2025-12-11",
    color: "bg-blue-500",
  },
  {
    id: "12",
    title: "🎄 Christmas Shopping",
    type: "task",
    date: "2025-12-18",
    color: "bg-blue-500",
  },
  {
    id: "13",
    title: "📊 Year-end Report",
    type: "task",
    date: "2025-12-30",
    color: "bg-orange-600",
  },

  // Subscriptions
  {
    id: "14",
    title: "🎬 Netflix",
    type: "subscription",
    date: "2025-12-05",
    color: "bg-purple-500",
  },
  {
    id: "16",
    title: "💪 Gym",
    type: "subscription",
    date: "2025-12-15",
    color: "bg-purple-500",
  },
  {
    id: "27",
    title: "📱 Phone Plan",
    type: "subscription",
    date: "2025-12-28",
    color: "bg-purple-500",
  },

  // Pomodoro Sessions
  {
    id: "18",
    title: "📚 Study Session",
    type: "pomodoro",
    date: "2025-12-02",
    color: "bg-amber-500",
  },
  {
    id: "20",
    title: "⚛️ Learning React",
    type: "pomodoro",
    date: "2025-12-09",
    color: "bg-amber-500",
  },
  {
    id: "22",
    title: "🎨 Design Work",
    type: "pomodoro",
    date: "2025-12-16",
    color: "bg-amber-500",
  },
  {
    id: "29",
    title: "🧘 Meditation",
    type: "pomodoro",
    date: "2025-12-29",
    color: "bg-amber-500",
  },

  // Additional events for busy day example (December 15th)
  {
    id: "25",
    title: "💰 Bonus Payment",
    type: "transaction",
    date: "2025-12-27",
    color: "bg-green-500",
  },
  {
    id: "30",
    title: "☕ Coffee Meeting",
    type: "transaction",
    date: "2025-12-15",
    color: "bg-red-500",
  },
  {
    id: "31",
    title: "📝 Client Call",
    type: "task",
    date: "2025-12-15",
    color: "bg-yellow-500",
  },
  {
    id: "32",
    title: "🎨 Design Review",
    type: "pomodoro",
    date: "2025-12-15",
    color: "bg-amber-500",
  },
];

const CalendarWidget = () => {
  const [currentDate] = useState(new Date(2025, 11, 1)); // December 2025

  // Get calendar grid (simplified for widget)
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
    <div className="p-6 mb-6 border shadow-md bg-card rounded-xl border-border">
      {/* Development Banner */}
      <div className="p-6 mb-4 text-center border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            🚧 Calendar Integration - Currently in Development
          </span>
        </div>
        <p className="text-base text-amber-700 dark:text-amber-300 leading-relaxed">
          This preview shows how your unified calendar will integrate with our
          currently released features
        </p>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-center text-foreground">
          📅 {monthNames[month]} {year}
        </h2>
        <Link
          href="/calendar"
          className="px-3 py-1 text-sm text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
        >
          View Full Calendar
        </Link>
      </div>

      {/* Mini Legend */}
      <div className="flex flex-wrap gap-8 mb-4 text-[15px] justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
          <span className="text-muted-foreground">Holidays</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-muted-foreground">Expenses</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-muted-foreground">Subscriptions</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="text-muted-foreground">Pomodoro</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          <span className="text-muted-foreground">High Priority</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={index}
            className="p-1 text-xs font-medium text-center text-muted-foreground"
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
              className={`min-h-[60px] p-1 border border-border/30 text-xs ${
                isCurrentMonth ? "bg-card" : "bg-muted/30"
              } ${
                isToday ? "ring-1 ring-primary" : ""
              } hover:bg-secondary/50 transition-colors`}
            >
              <div
                className={`font-medium mb-1 ${
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {day.getDate()}
              </div>

              {/* Events - show as dots with text for better UX */}
              <div className="space-y-1">
                {events.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-1"
                    title={event.title}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${event.color} flex-shrink-0`}
                    />
                    <span className="text-[14px] truncate text-foreground">
                      {event.title
                        .replace(
                          /[🎄🛒💰🚨🎬📚👥🎵⛽🍽️📈🎁🏥🔍📊🏠📝💪☁️📱✍️🎨🔍📖🧘🎆☕⚛️💼]/g,
                          ""
                        )
                        .trim()}
                    </span>
                  </div>
                ))}
                {events.length > 2 && (
                  <div className="text-[14px] text-muted-foreground">
                    +{events.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Integrates all your Life Dashboard data</span>
          <Link
            href="/calendar"
            className="font-medium text-primary hover:text-primary/80"
          >
            See Full Preview →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
