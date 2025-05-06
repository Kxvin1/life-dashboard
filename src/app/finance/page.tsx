"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const FinancePage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated) {
      // Redirect to the overview page when accessing /finance directly
      router.push("/finance/overview");
    }
  }, [isAuthenticated, isLoading, router]);

  // This page will not be rendered as we redirect to /finance/overview
  return null;
};

export default FinancePage;
