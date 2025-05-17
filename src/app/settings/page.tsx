"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

const SettingsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-foreground">Theme</h3>
            <p className="text-sm text-muted-foreground">
              Choose between light and dark mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base transition-colors rounded-md bg-secondary text-foreground hover:bg-secondary/80 self-start sm:self-center"
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </div>

      <div className="p-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Account</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-2">
              <h3 className="font-medium text-foreground">
                Email Notifications
              </h3>
              <div className="relative inline-block ml-3">
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  onMouseEnter={() => setShowTooltip("email")}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  Coming Soon
                </span>
                {showTooltip === "email" && (
                  <div className="absolute z-50 w-64 p-2 text-xs rounded shadow-lg pointer-events-none bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover text-popover-foreground">
                    <p className="font-medium">Feature in Development</p>
                    <p className="mt-1">
                      Email notifications are coming soon. We're working on
                      implementing this feature.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center opacity-60">
              <input
                type="checkbox"
                id="email-notifications"
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-not-allowed"
                disabled
              />
              <label
                htmlFor="email-notifications"
                className="ml-2 text-foreground cursor-not-allowed"
              >
                Receive email notifications
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <h3 className="font-medium text-foreground">Currency</h3>
              <div className="relative inline-block ml-3">
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  onMouseEnter={() => setShowTooltip("currency")}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  Coming Soon
                </span>
                {showTooltip === "currency" && (
                  <div className="absolute z-50 w-64 p-2 text-xs rounded shadow-lg pointer-events-none bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover text-popover-foreground">
                    <p className="font-medium">Feature in Development</p>
                    <p className="mt-1">
                      Currency selection is coming soon. Currently, all amounts
                      are displayed in USD ($).
                    </p>
                  </div>
                )}
              </div>
            </div>
            <select
              className="w-full max-w-xs px-3 py-2 border rounded-md border-border bg-background text-foreground opacity-60 cursor-not-allowed"
              disabled
            >
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
