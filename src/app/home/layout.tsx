"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="home-layout">
      <AuthProvider>
        <ThemeProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}
