"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { useEffect } from "react";
import { setupFetchInterceptor } from "@/lib/fetchInterceptor";

export default function Providers({ children }: { children: ReactNode }) {
  // Set up fetch interceptor once at the root level
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Initialize the fetch interceptor only once
        setupFetchInterceptor();
      } catch (error) {
        console.error("Error setting up fetch interceptor:", error);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <DashboardProvider>
          <PomodoroProvider>
            <TaskProvider>{children}</TaskProvider>
          </PomodoroProvider>
        </DashboardProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
