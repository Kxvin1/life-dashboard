"use client";

import { useState, useEffect } from "react";
import {
  fetchSubscriptionSummary,
  fetchSubscriptions,
} from "@/services/subscriptionService";
import { formatCurrency } from "@/lib/utils";
import { Subscription } from "@/types/finance";

interface SubscriptionSummaryProps {
  key?: number; // This is just to make TypeScript happy with the key prop
}

const SubscriptionSummary = ({}: SubscriptionSummaryProps) => {
  const [totalMonthlyCost, setTotalMonthlyCost] = useState<number>(0);
  const [futureMonthlyCost, setFutureMonthlyCost] = useState<number>(0);
  const [totalCombinedMonthlyCost, setTotalCombinedMonthlyCost] =
    useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [futureCount, setFutureCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [yearlyTotal, setYearlyTotal] = useState<number>(0);
  const [upcomingPayments, setUpcomingPayments] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display with Pacific Time (PT) adjustment
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";

    // Parse the date string directly without timezone conversion
    // Format: YYYY-MM-DD
    const [year, month, day] = dateString
      .split("-")
      .map((num) => parseInt(num, 10));

    // Create a date string with the exact values (no timezone adjustment)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "America/Los_Angeles", // Pacific Time
    };

    // Create a date with the exact values from the input
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, options);
  };

  // Check if a date is in the future
  const isFutureDate = (dateString: string | null) => {
    if (!dateString) return false;

    // Parse the date string
    const [year, month, day] = dateString
      .split("-")
      .map((num) => parseInt(num, 10));

    // Create date objects without time components for accurate comparison
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return inputDate > todayWithoutTime;
  };

  // Function to load subscription data
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch summary data
      const summaryData = await fetchSubscriptionSummary();

      setTotalMonthlyCost(summaryData.total_monthly_cost);
      setFutureMonthlyCost(summaryData.future_monthly_cost);
      setTotalCombinedMonthlyCost(summaryData.total_combined_monthly_cost);
      setActiveCount(summaryData.active_subscriptions_count);
      setFutureCount(summaryData.future_subscriptions_count);
      setTotalCount(summaryData.total_subscriptions_count);
      setYearlyTotal(summaryData.total_combined_monthly_cost * 12);

      // Fetch active subscriptions for upcoming payments
      const subscriptions = await fetchSubscriptions("active");

      // Sort subscriptions by next payment date (or start date for future subscriptions)
      const sortedSubscriptions = [...subscriptions].sort((a, b) => {
        // Get the effective date for each subscription (next payment date or start date for future ones)
        const getEffectiveDate = (sub) => {
          if (isFutureDate(sub.start_date)) {
            return new Date(sub.start_date).getTime();
          } else {
            return sub.next_payment_date
              ? new Date(sub.next_payment_date).getTime()
              : Infinity;
          }
        };

        const dateA = getEffectiveDate(a);
        const dateB = getEffectiveDate(b);

        // Sort by the effective date (ascending - closest date first)
        return dateA - dateB;
      });

      // Get the next 3 upcoming payments
      setUpcomingPayments(sortedSubscriptions.slice(0, 3));

      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling to refresh data periodically
  useEffect(() => {
    // Load data immediately
    loadData();

    // Set up an interval to refresh data every 5 seconds
    const intervalId = setInterval(() => {
      loadData();
    }, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 border shadow-md bg-card rounded-xl border-border animate-pulse">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Subscription Summary
        </h2>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-6 bg-muted rounded w-2/3"></div>
          <div className="mt-6 h-4 bg-muted rounded w-full"></div>
          <div className="h-12 bg-muted rounded w-full"></div>
          <div className="h-12 bg-muted rounded w-full"></div>
          <div className="h-12 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border shadow-md bg-card rounded-xl border-border">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Subscription Summary
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
        Subscription Summary
      </h2>

      {/* Cost Summary */}
      <div className="space-y-4 mb-6">
        {/* Current Subscriptions */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Current Monthly Cost:</span>
          <span className="text-xl font-semibold text-foreground">
            {formatCurrency(totalMonthlyCost)}
          </span>
        </div>

        {/* Future Subscriptions - Only show if there are any */}
        {futureCount > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Future Monthly Cost:
              </span>
              <span className="text-lg font-medium text-primary">
                {formatCurrency(futureMonthlyCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Combined Monthly Cost:
              </span>
              <span className="text-lg font-medium text-foreground">
                {formatCurrency(totalCombinedMonthlyCost)}
              </span>
            </div>
          </>
        )}

        {/* Yearly Cost */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Yearly Cost:</span>
          <span className="text-lg font-medium text-foreground">
            {formatCurrency(yearlyTotal)}
          </span>
        </div>

        {/* Subscription Counts */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Active Now:</span>
          <span className="text-lg font-medium text-foreground">
            {activeCount}
          </span>
        </div>

        {/* Future Subscriptions Count - Only show if there are any */}
        {futureCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Starting in Future:</span>
            <span className="text-lg font-medium text-primary">
              {futureCount}
            </span>
          </div>
        )}
      </div>

      {/* Upcoming Payments */}
      <div className="mt-6">
        <h3 className="text-md font-medium text-foreground mb-3 border-b border-border pb-2">
          Upcoming Payments
        </h3>

        {upcomingPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming payments found.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingPayments.map((subscription) => (
              <div
                key={subscription.id}
                className="p-3 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{subscription.name}</span>
                  <span className="text-primary font-semibold">
                    {formatCurrency(subscription.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-sm">
                  <span className="text-muted-foreground">
                    {subscription.billing_frequency}
                  </span>
                  <span className="text-muted-foreground">
                    {isFutureDate(subscription.start_date) ? (
                      <>First Payment: {formatDate(subscription.start_date)}</>
                    ) : (
                      <>Due: {formatDate(subscription.next_payment_date)}</>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSummary;
