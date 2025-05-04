"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { formatCurrency } from "@/lib/utils";
import { MonthlySummary } from "@/types/finance";

interface TransactionSummaryProps {
  year: number;
  month: number | null;
  categoryId: number | null;
}

export default function TransactionSummary({
  year,
  month,
  categoryId,
}: TransactionSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<
    Record<number, MonthlySummary>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get("token");

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/v1/summaries/monthly?year=${year}${
            month ? `&month=${month}` : ""
          }${categoryId ? `&category_id=${categoryId}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch summary");
        const data = await response.json();
        setMonthlyData(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, categoryId]);

  if (loading) {
    return (
      <div>
        <div className="w-1/4 h-6 mb-4 rounded bg-secondary animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="p-6 border shadow-md bg-card rounded-xl border-border">
            <div className="space-y-4 animate-pulse">
              <div className="w-1/2 h-4 rounded bg-secondary"></div>
              <div className="w-3/4 h-6 rounded bg-secondary"></div>
            </div>
          </div>
          <div className="p-6 border shadow-md bg-card rounded-xl border-border">
            <div className="space-y-4 animate-pulse">
              <div className="w-1/2 h-4 rounded bg-secondary"></div>
              <div className="w-3/4 h-6 rounded bg-secondary"></div>
            </div>
          </div>
          <div className="p-6 border shadow-md bg-card rounded-xl border-border">
            <div className="space-y-4 animate-pulse">
              <div className="w-1/2 h-4 rounded bg-secondary"></div>
              <div className="w-3/4 h-6 rounded bg-secondary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border bg-destructive/10 text-destructive rounded-xl border-destructive/20">
        Error: {error}
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthData = monthlyData[currentMonth] || {
    income: 0,
    expense: 0,
    net: 0,
  };

  const currentMonthName = new Date(year, currentMonth - 1).toLocaleString(
    "default",
    { month: "long" }
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium text-foreground">
        {currentMonthName} {year}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-6 transition-shadow duration-300 border shadow-md bg-card rounded-xl hover:shadow-lg border-border">
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">
            Income
          </h3>
          <p className="text-2xl font-bold text-green-600 truncate md:text-3xl">
            {formatCurrency(currentMonthData.income)}
          </p>
        </div>

        <div className="p-6 transition-shadow duration-300 border shadow-md bg-card rounded-xl hover:shadow-lg border-border">
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">
            Expenses
          </h3>
          <p className="text-2xl font-bold text-red-600 truncate md:text-3xl">
            {formatCurrency(currentMonthData.expense)}
          </p>
        </div>

        <div className="p-6 transition-shadow duration-300 border shadow-md bg-card rounded-xl hover:shadow-lg border-border">
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">
            Net
          </h3>
          <p
            className={`text-2xl md:text-3xl font-bold truncate ${
              currentMonthData.net >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(currentMonthData.net)}
          </p>
        </div>
      </div>
    </div>
  );
}
