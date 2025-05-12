"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import OverviewSummary from "@/components/finance/OverviewSummaryDark";
import CategorySelect from "@/components/finance/CategorySelect";
import BackToHome from "@/components/common/BackToHome";

export default function OverviewPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setViewMode("monthly");
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        {/* Back to Home button */}
        <div className="mb-4">
          <BackToHome />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Transactions Overview
          </h1>
          <p className="mt-2 text-muted-foreground">
            View your transaction history and analyze spending patterns by month
            or year
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 mb-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Filters
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-foreground">
                Year
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-foreground">
                Month
              </label>
              <div className="relative">
                <select
                  value={selectedMonth || ""}
                  onChange={(e) =>
                    setSelectedMonth(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-foreground">
                Category
              </label>
              <div className="relative">
                <CategorySelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-foreground">
                View Mode
              </label>
              <div className="relative">
                <select
                  value={viewMode}
                  onChange={(e) =>
                    setViewMode(e.target.value as "monthly" | "yearly")
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="monthly">Monthly View</option>
                  <option value="yearly">Yearly View</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <OverviewSummary
          year={selectedYear}
          month={selectedMonth}
          categoryId={selectedCategory}
          viewMode={viewMode}
          onMonthSelect={handleMonthSelect}
        />
      </div>
    </div>
  );
}
