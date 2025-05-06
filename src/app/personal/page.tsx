"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "@/components/common/BackToHome";

const PersonalOrgPage = () => {
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
          Personal Organization
        </h2>
        <p className="text-muted-foreground mb-6">
          Tools to help you organize your personal life, including notes,
          reading lists, and more.
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Personal Organization Module Coming Soon
            </h3>
            <p className="text-muted-foreground">
              This module is currently under development. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalOrgPage;
