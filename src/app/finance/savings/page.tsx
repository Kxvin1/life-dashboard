"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "@/components/common/BackToHome";

const SavingsGoalsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
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
    <div className="p-6">
      {/* Back to Home button */}
      <div className="mb-4">
        <BackToHome />
      </div>

      <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Savings Goals
        </h2>
        <p className="text-muted-foreground mb-6">
          Set and track your savings goals to reach your financial targets.
        </p>

        <div className="bg-secondary/30 rounded-lg p-6 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="h-12 w-12 text-primary mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Savings Goals Coming Soon
            </h3>
            <p className="text-muted-foreground">
              This feature is currently under development. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoalsPage;
