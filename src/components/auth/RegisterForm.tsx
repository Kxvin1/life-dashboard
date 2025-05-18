"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const { register, loginAsDemo, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const MAX_NAME_LENGTH = 20;

  // Ensure theme is applied correctly
  useEffect(() => {
    // Force a re-render of the theme state to ensure it's in sync with localStorage
    const currentTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    if (currentTheme && currentTheme !== theme) {
      // This will update the theme state to match localStorage
      if (currentTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  // Check for auth messages in sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authMessage = sessionStorage.getItem("auth_message");
      if (authMessage) {
        setError(authMessage);
        // Clear the message from sessionStorage
        sessionStorage.removeItem("auth_message");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name length
    if (name.length > MAX_NAME_LENGTH) {
      setError(`Name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }

    try {
      await register(email, password, name);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during registration"
      );
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to login as demo user"
      );
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative"
              role="alert"
            >
              {/* Split error messages by period for better formatting */}
              {error.split(". ").map((message, index) => (
                <div key={index} className="block mb-1 last:mb-0">
                  {message}
                </div>
              ))}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <span className="text-xs text-muted-foreground text-gray-500 dark:text-gray-400">
                  {name.length}/{MAX_NAME_LENGTH} characters
                </span>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={MAX_NAME_LENGTH}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Name"
                value={name}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_NAME_LENGTH) {
                    setName(e.target.value);
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Register"}
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs">
                or
              </span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading || isDemoLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-green-600 dark:border-green-500 text-sm font-medium rounded-md text-green-600 dark:text-green-500 bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Try the app with sample data without creating an account"
            >
              {isDemoLoading ? "Loading demo..." : "Try Demo Mode"}
            </button>
          </div>

          <div className="text-sm text-center space-y-2">
            <div>
              <Link
                href="/login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Already have an account? Sign in
              </Link>
            </div>
            <div>
              <Link
                href="/home"
                className="font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
