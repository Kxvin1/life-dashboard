"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/types/finance";
import { fetchTransactions } from "@/services/transactionService";
import { fetchSubscriptionSummary } from "@/services/subscriptionService";
import { fetchMonthlySummary } from "@/services/summaryService";
import { useDashboard } from "@/contexts/DashboardContext";
import DashboardCard from "./DashboardCard";

// Frontend cache for account summary
interface CacheEntry {
  data: FinancialData;
  timestamp: number;
  expiresIn: number;
}

class AccountSummaryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 1800000; // 30 minutes

  set(key: string, data: FinancialData, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  get(key: string): FinancialData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const accountSummaryCache = new AccountSummaryCache();

// Request deduplication
const pendingRequests = new Map<string, Promise<FinancialData>>();

// Export function to clear account summary cache (for use by other services)
export const clearAccountSummaryCache = () => {
  accountSummaryCache.clear();
  pendingRequests.clear();
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

  const { allCards } = useDashboard();

  // Get only the finance tools
  const financeTools = allCards.filter(
    (card) => card.category === "finance" && card.isImplemented
  );

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current year for fetching data
        const currentYear = new Date().getFullYear();
        const cacheKey = `account_summary_${currentYear}`;

        // Check cache first
        const cachedData = accountSummaryCache.get(cacheKey);
        if (cachedData) {
          setFinancialData(cachedData);
          setLoading(false);
          return;
        }

        // Check if there's already a pending request
        if (pendingRequests.has(cacheKey)) {
          const data = await pendingRequests.get(cacheKey)!;
          setFinancialData(data);
          setLoading(false);
          return;
        }

        // Create the data fetching promise
        const dataPromise = (async (): Promise<FinancialData> => {
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

          // Return the financial data
          return {
            netWorth,
            ytdIncome,
            ytdExpenses,
            monthlySubscriptionCost,
          };
        })();

        // Store the pending request
        pendingRequests.set(cacheKey, dataPromise);

        // Execute the promise
        const data = await dataPromise;

        // Cache the result for 30 minutes
        accountSummaryCache.set(cacheKey, data);

        // Set the financial data
        setFinancialData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch financial data"
        );
      } finally {
        setLoading(false);
        // Clean up pending request
        const currentYear = new Date().getFullYear();
        const cacheKey = `account_summary_${currentYear}`;
        pendingRequests.delete(cacheKey);
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

      {/* Financial Data Section */}
      <div className="mb-6">
        <div className="space-y-4">
          {/* Net Worth */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Net Worth</span>
              <span
                className={`font-medium ${
                  financialData.netWorth >= 0
                    ? "text-[#4ade80]"
                    : "text-red-500"
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

      {/* Financial Tools Section */}
      <div>
        <h3 className="mb-3 text-lg font-medium text-foreground">
          Financial Tools
        </h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {financeTools.map((card) => (
            <div key={card.id} className="scale-95">
              <DashboardCard card={card} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
