"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "@/components/common/BackToHome";

const BudgetingPage = () => {
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

      <div className="p-6 mb-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Monthly Budget
        </h2>
        <p className="mb-6 text-muted-foreground">
          Create and manage your monthly budget to track your spending against
          planned amounts.
        </p>

        <div className="flex items-center justify-center p-6 rounded-lg bg-secondary/30">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              Budgeting Tool Coming Soon
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

export default BudgetingPage;
