"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import PomodoroTimer from "@/components/productivity/PomodoroTimer";
import PomodoroTaskManager from "@/components/productivity/PomodoroTaskManager";
import PomodoroHistory from "@/components/productivity/PomodoroHistory";
import PomodoroAIButton from "@/components/productivity/PomodoroAIButton";
import BackToHome from "@/components/common/BackToHome";

const PomodoroPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timer" | "history">("timer");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
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
    <PomodoroProvider>
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-6xl">
          {/* Back to Home button */}
          <div className="mb-4">
            <BackToHome />
          </div>

          <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Pomodoro Timer
            </h2>
            <p className="text-muted-foreground mb-6">
              Use the Pomodoro Technique to boost your productivity with focused
              work sessions and regular breaks.
            </p>

            {/* Tab navigation */}
            <div className="flex border-b border-border mb-6">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "timer"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("timer")}
              >
                Timer
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "history"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("history")}
              >
                History
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "timer" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PomodoroTimer />
                </div>
                <div>
                  <PomodoroTaskManager />
                </div>
              </div>
            ) : (
              <div>
                {/* AI Insights Section */}
                <div className="transition-shadow duration-300 border shadow-md bg-card rounded-xl hover:shadow-lg border-border backdrop-blur-sm mb-6">
                  <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="flex items-center mb-2">
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
                          className="text-primary mr-2"
                        >
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                          <path d="M5 3v4" />
                          <path d="M19 17v4" />
                          <path d="M3 5h4" />
                          <path d="M17 19h4" />
                        </svg>
                        <h2 className="text-xl font-semibold text-foreground">
                          AI Productivity Insights
                        </h2>
                      </div>
                      <p className="text-muted-foreground text-sm max-w-2xl">
                        Generate personalized productivity insights and
                        recommendations based on your Pomodoro session history.
                        Analyze your work patterns and get tips to improve your
                        focus and efficiency.
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <PomodoroAIButton />
                    </div>
                  </div>
                </div>
                <PomodoroHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </PomodoroProvider>
  );
};

export default PomodoroPage;
