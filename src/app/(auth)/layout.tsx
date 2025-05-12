"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <AuthProvider>
        <ThemeProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}
