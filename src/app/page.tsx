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
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl shadow-md border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Your Profile
          </h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-muted-foreground w-24">Email:</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground w-24">Name:</span>
              <span className="text-foreground">{user?.full_name}</span>
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
