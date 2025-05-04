"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  // Theme context is imported but not currently used
  useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Determine page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/overview") return "Financial Overview";
    if (pathname === "/finance") return "Income & Expenses";
    if (pathname === "/finance/budgeting") return "Budgeting";
    if (pathname === "/finance/subscriptions") return "Subscriptions";
    if (pathname === "/finance/savings") return "Savings Goals";
    if (pathname === "/settings") return "Settings";
    if (pathname === "/productivity") return "Productivity";
    if (pathname === "/health") return "Health";
    if (pathname === "/personal") return "Personal Organization";

    // Extract the last part of the path for other pages
    const parts = pathname.split("/");
    return (
      parts[parts.length - 1].charAt(0).toUpperCase() +
      parts[parts.length - 1].slice(1)
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-foreground">
        {getPageTitle()}
      </h1>

      <div className="relative" ref={optionsRef}>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 rounded-full hover:bg-secondary text-foreground"
          aria-label="Options"
        >
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover border border-border z-50">
            <div className="py-1">
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
                onClick={() => setShowOptions(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  setShowOptions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
