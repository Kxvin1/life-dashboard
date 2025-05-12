"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onMenuToggle?: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const { logout, isAuthenticated, isLoading, user } = useAuth();
  // Theme context is imported but not currently used
  useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Determine page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/") return "Life Dashboard";
    if (pathname === "/finance") return "Finance"; // Redirect page
    if (pathname === "/finance/overview") return "Financial Overview";
    if (pathname === "/finance/transactions") return "Add Transaction";
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

  // For public pages like /home, we need a simplified navbar
  if (!isAuthenticated) {
    // Only render a navbar for the home page
    if (pathname === "/home") {
      return (
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-foreground">
              Life Dashboard
            </h1>
          </div>
        </header>
      );
    }
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Hamburger menu button - only visible on mobile */}
        <button
          className="md:hidden mr-4 p-2 rounded-md text-foreground hover:bg-secondary"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <h1 className="text-xl font-semibold text-foreground">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-3 relative" ref={optionsRef}>
        {/* User's full name - clickable */}
        <span
          className="text-foreground hover:text-primary cursor-pointer"
          onClick={() => setShowOptions(!showOptions)}
        >
          {user?.full_name || "User"}
        </span>

        {/* Profile picture icon - clickable */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 rounded-full hover:bg-secondary text-foreground"
          aria-label="User profile"
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
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {showOptions && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-popover border border-border z-50">
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
