"use client";

import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

const inter = Inter({ subsets: ["latin"] });

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-[#0d1117]`}>
        <AuthProvider>
          <ThemeProvider>
            <DashboardProvider>{children}</DashboardProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
