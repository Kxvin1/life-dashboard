import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life Dashboard",
  description: "Your personal life management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-[#0d1117]`}>
        <AuthProvider>
          <ThemeProvider>
            <DashboardProvider>
              <div className="flex min-h-screen">
                <div className="sticky top-0 h-screen">
                  <Sidebar />
                </div>
                <div className="flex-1 flex flex-col">
                  <Navbar />
                  <main className="flex-1 min-h-screen bg-background overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </DashboardProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
