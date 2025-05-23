"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/types/finance";
import { fetchTransactions } from "@/services/transactionService";
import { fetchSubscriptionSummary } from "@/services/subscriptionService";

// Quick helper function for monthly summary
const fetchMonthlySummary = async (year: number) => {
  const token = Cookies.get("token");
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/summaries/monthly?year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch yearly summary");
  return await response.json();
};

interface FinancialData {
  netWorth: number;
  ytdIncome: number;
  ytdExpenses: number;
  monthlySubscriptionCost: number;
}

export default function DashboardAccountSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    netWorth: 0,
    ytdIncome: 0,
    ytdExpenses: 0,
    monthlySubscriptionCost: 0,
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get("token");

        // Get current year for fetching data
        const currentYear = new Date().getFullYear();

        // Use the transaction service with caching and deduplication
        const transactions: Transaction[] = await fetchTransactions();

        // Calculate lifetime totals from all transactions (net worth)
        const lifetimeIncome = transactions
          .filter((t: Transaction) => t.type === "income")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const lifetimeExpenses = transactions
          .filter((t: Transaction) => t.type === "expense")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const netWorth = lifetimeIncome - lifetimeExpenses;

        // Fetch current year's monthly summaries for YTD calculations
        const yearSummaryData = await fetchMonthlySummary(currentYear);

        // Calculate YTD income and expenses
        let ytdIncome = 0;
        let ytdExpenses = 0;

        Object.values(yearSummaryData.summary).forEach((monthData: any) => {
          ytdIncome += monthData.income || 0;
          ytdExpenses += monthData.expense || 0;
        });

        // Fetch subscription summary
        let monthlySubscriptionCost = 0;
        try {
          const subscriptionSummary = await fetchSubscriptionSummary();
          monthlySubscriptionCost = subscriptionSummary.total_monthly_cost;
        } catch (subscriptionError) {
          console.error(
            "Failed to fetch subscription data:",
            subscriptionError
          );
          // Continue with zero cost if there's an error
        }

        // Set the financial data with just what we need
        setFinancialData({
          netWorth,
          ytdIncome,
          ytdExpenses,
          monthlySubscriptionCost,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch financial data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Account Summary
        </h2>
        <div className="space-y-4 animate-pulse">
          {/* Net Worth Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="w-24 h-4 rounded bg-secondary"></div>
              <div className="w-20 h-4 rounded bg-secondary"></div>
            </div>
            <div className="w-full h-1 rounded-full bg-secondary/30"></div>
          </div>

          {/* Year to Date Skeleton */}
          <div>
            <div className="h-4 mb-2 rounded w-28 bg-secondary"></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 rounded bg-secondary"></div>
                <div className="w-20 h-4 rounded bg-secondary"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 rounded w-28 bg-secondary"></div>
                <div className="w-20 h-4 rounded bg-secondary"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 rounded bg-secondary"></div>
                <div className="w-20 h-4 rounded bg-secondary"></div>
              </div>
            </div>
          </div>

          {/* Subscriptions Skeleton */}
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="h-4 rounded w-28 bg-secondary"></div>
              <div className="w-24 h-4 rounded bg-secondary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Account Summary
        </h2>
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          Error: {error}
        </div>
      </div>
    );
  }

  // Get current year for display
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 border shadow-md bg-card rounded-xl border-border">
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        Account Summary
      </h2>
      <div className="space-y-4">
        {/* Net Worth */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground">Net Worth</span>
            <span
              className={`font-medium ${
                financialData.netWorth >= 0 ? "text-[#4ade80]" : "text-red-500"
              }`}
            >
              {formatCurrency(financialData.netWorth)}
            </span>
          </div>
          <div className="w-full h-1 overflow-hidden rounded-full bg-secondary/50">
            <div
              className={`h-full ${
                financialData.netWorth >= 0 ? "bg-[#4ade80]" : "bg-red-500"
              }`}
              style={{
                width: `${Math.min(
                  (Math.abs(financialData.netWorth) /
                    (financialData.ytdIncome || 1)) *
                    100,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Year to Date */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">
            {currentYear} Summary
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Income</span>
              <span className="text-[#4ade80] font-medium">
                {formatCurrency(financialData.ytdIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-medium text-red-500">
                {formatCurrency(financialData.ytdExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="pt-2 mt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subscriptions</span>
            <span className="font-medium text-foreground">
              {formatCurrency(financialData.monthlySubscriptionCost)}/mo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
