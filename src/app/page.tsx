"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import QuickAccess from "@/components/dashboard/QuickAccess";
import AllTools from "@/components/dashboard/AllTools";
import DashboardAccountSummary from "@/components/dashboard/DashboardAccountSummary";

const HomePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/home");
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
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Welcome to Life Dashboard
          </h2>
          <div className="space-y-3">
            <p className="text-foreground">
              Hi {user?.full_name}, here&apos;s how to get started:
            </p>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="mr-2 font-medium text-primary">1.</span>
                <span className="text-foreground">
                  Use <strong>Quick Access</strong> for your favorite tools
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 font-medium text-primary">2.</span>
                <span className="text-foreground">
                  Explore <strong>All Tools</strong> to discover more features
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 font-medium text-primary">3.</span>
                <span className="text-foreground">
                  Add tools to Quick Access by clicking the <strong>+</strong>{" "}
                  button
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 font-medium text-primary">4.</span>
                <span className="text-foreground">
                  Track your finances in the <strong>Finance</strong> section
                </span>
              </div>
            </div>
          </div>
        </div>

        <DashboardAccountSummary />
      </div>

      {/* Quick Access Section */}
      <QuickAccess />

      {/* All Tools Section */}
      <AllTools />
    </div>
  );
};

export default HomePage;
