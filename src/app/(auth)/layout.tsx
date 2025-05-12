"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import ScrollToTop from "@/components/common/ScrollToTop";
import AuthNavbar from "@/components/layout/AuthNavbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Add useEffect to ensure theme is applied correctly
  useEffect(() => {
    // This ensures the theme is applied correctly after component mounts
    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    if (storedTheme) {
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  return (
    <div className="auth-layout">
      <AuthProvider>
        <ThemeProvider>
          <DashboardProvider>
            <ScrollToTop />
            <AuthNavbar />
            <div className="pt-16">{children}</div>
          </DashboardProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}
