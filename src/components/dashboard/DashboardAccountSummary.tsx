"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { formatCurrency } from "@/lib/utils";
import { Transaction, MonthlySummary } from "@/types/finance";

interface FinancialData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export default function DashboardAccountSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get("token");

        // Get current date info for fetching current month's data
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

        // Fetch monthly summary for current month
        const monthlySummaryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/summaries/monthly?year=${currentYear}&month=${currentMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!monthlySummaryResponse.ok) {
          throw new Error("Failed to fetch monthly summary");
        }

        const monthlySummaryData = await monthlySummaryResponse.json();
        const monthData: MonthlySummary = monthlySummaryData.summary[
          currentMonth
        ] || {
          income: 0,
          expense: 0,
          net: 0,
        };

        // Fetch all transactions to calculate total balance
        const transactionsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!transactionsResponse.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const transactions: Transaction[] = await transactionsResponse.json();

        // Calculate lifetime totals from all transactions
        const lifetimeIncome = transactions
          .filter((t: Transaction) => t.type === "income")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const lifetimeExpenses = transactions
          .filter((t: Transaction) => t.type === "expense")
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        // Calculate net worth (all time income minus all time expenses)
        const netWorth = lifetimeIncome - lifetimeExpenses;

        setFinancialData({
          totalBalance: netWorth,
          monthlyIncome: monthData.income,
          monthlyExpenses: monthData.expense,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch financial data"
        );
        console.error("Error fetching financial data:", err);
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
        <div className="space-y-4">
          <div className="space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 rounded bg-secondary"></div>
              <div className="w-20 h-4 rounded bg-secondary"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 rounded bg-secondary w-28"></div>
              <div className="w-16 h-4 rounded bg-secondary"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-32 h-4 rounded bg-secondary"></div>
              <div className="w-24 h-4 rounded bg-secondary"></div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="w-24 h-4 rounded bg-secondary"></div>
              <div className="w-20 h-4 rounded bg-secondary"></div>
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

  return (
    <div className="p-6 border shadow-md bg-card rounded-xl border-border">
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        Account Summary
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Net Worth</span>
          <span
            className={`font-medium ${
              financialData.totalBalance >= 0
                ? "text-[#4ade80]"
                : "text-red-500"
            }`}
          >
            {formatCurrency(financialData.totalBalance)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly Income</span>
          <span className="text-[#4ade80] font-medium">
            {formatCurrency(financialData.monthlyIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly Expenses</span>
          <span className="font-medium text-red-500">
            {formatCurrency(financialData.monthlyExpenses)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
          <span className="text-muted-foreground">Subscriptions</span>
          <span className="font-medium text-foreground">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
