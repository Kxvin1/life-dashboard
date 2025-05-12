"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ScrollToTop from "@/components/common/ScrollToTop";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileSidebarOpen]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Component to handle scrolling to top on route changes */}
      <ScrollToTop />

      {/* Only render sidebars if user is authenticated */}
      {isAuthenticated && (
        <>
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Sidebar */}
          <Sidebar
            isMobile={true}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </>
      )}

      <div className="flex-1 flex flex-col w-full">
        <Navbar
          onMenuToggle={isAuthenticated ? toggleMobileSidebar : undefined}
        />
        <main className="flex-1 min-h-screen bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Script to apply theme before React hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check if localStorage is available
                  if (typeof localStorage !== 'undefined') {
                    var storedTheme = localStorage.getItem('theme');
                    var theme = storedTheme || 'dark'; // Default to dark if no theme is stored

                    // Apply theme to document
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }

                    // If no theme was stored, set the default
                    if (!storedTheme) {
                      localStorage.setItem('theme', 'dark');
                    }
                  } else {
                    // If localStorage is not available, default to dark
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // If there's an error (e.g., localStorage blocked), default to dark
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} dark:bg-[#0d1117]`}>
        <AuthProvider>
          <ThemeProvider>
            <DashboardProvider>
              <LayoutContent>{children}</LayoutContent>
            </DashboardProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
