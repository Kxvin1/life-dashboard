"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

const SettingsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

      <div className="p-6 mb-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Appearance
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Theme</h3>
            <p className="text-sm text-muted-foreground">
              Choose between light and dark mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80"
          >
            {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </div>

      <div className="p-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Account</h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-medium text-foreground">
              Email Notifications
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
              />
              <label
                htmlFor="email-notifications"
                className="ml-2 text-foreground"
              >
                Receive email notifications
              </label>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-foreground">Currency</h3>
            <select className="w-full max-w-xs px-3 py-2 border rounded-md border-border bg-background text-foreground">
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="jpy">JPY (¥)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
