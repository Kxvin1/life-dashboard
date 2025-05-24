"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import QuickAccess from "@/components/dashboard/QuickAccess";
import AllTools from "@/components/dashboard/AllTools";
import DashboardAccountSummary from "@/components/dashboard/DashboardAccountSummary";
import CalendarWidget from "@/components/dashboard/CalendarWidget";

const HomePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Function to capitalize each word in a name
  const capitalizeFullName = (name: string | undefined): string => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Personalized welcome message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {capitalizeFullName(user?.full_name)}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Getting Started
          </h2>
          <div className="space-y-3">
            <p className="text-foreground">
              Here are the key features to explore:
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="mr-3 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="text-foreground">
                  <p>
                    <strong>Manage Your Finances</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Track income and expenses, manage subscriptions, and get
                    AI-powered financial insights
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-3 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="text-foreground">
                  <p>
                    <strong>Boost Productivity</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use the Pomodoro Timer to stay focused and track your work
                    sessions
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-3 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <div className="text-foreground">
                  <p>
                    <strong>Customize Your Dashboard</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add your favorite tools to Quick Access by clicking the{" "}
                    <strong>+</strong> button
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-3 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="text-foreground">
                  <p>
                    <strong>Check Your Account Summary</strong>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    View your net worth, year-to-date income and expenses, and
                    subscription costs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DashboardAccountSummary />
      </div>

      {/* Calendar Widget Section */}
      <CalendarWidget />

      {/* Quick Access Section */}
      <QuickAccess />

      {/* All Tools Section */}
      <AllTools />
    </div>
  );
};

export default HomePage;
