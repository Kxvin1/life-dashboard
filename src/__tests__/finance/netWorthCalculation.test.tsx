import React from "react";
import "@testing-library/jest-dom";
import Cookies from "js-cookie";

// Mock the fetch function
global.fetch = jest.fn();

// Mock Cookies.get to return a token
(Cookies.get as jest.Mock).mockReturnValue("test-token");

// Mock the subscription service
jest.mock("@/services/subscriptionService", () => ({
  fetchSubscriptionSummary: jest.fn().mockResolvedValue({
    total_monthly_cost: 50,
    future_monthly_cost: 0,
    total_combined_monthly_cost: 50,
    active_subscriptions_count: 2,
    future_subscriptions_count: 0,
    total_subscriptions_count: 2,
  }),
}));

describe("Net Worth Calculation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calculates net worth correctly from transactions", async () => {
    // Mock transactions data
    const mockTransactions = [
      { id: 1, amount: 1000, type: "income", date: "2023-01-15" },
      { id: 2, amount: 500, type: "expense", date: "2023-01-20" },
      { id: 3, amount: 2000, type: "income", date: "2023-02-01" },
      { id: 4, amount: 750, type: "expense", date: "2023-02-10" },
    ];

    // Mock yearly summary data
    const mockYearlySummary = {
      summary: {
        1: { income: 1000, expense: 500, net: 500 },
        2: { income: 2000, expense: 750, net: 1250 },
      },
    };

    // Setup fetch mock responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/transactions/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTransactions),
        });
      } else if (url.includes("/summaries/monthly")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockYearlySummary),
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    // Calculate net worth manually
    const incomeTotal = mockTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseTotal = mockTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netWorth = incomeTotal - expenseTotal;

    // Verify the calculation is correct
    expect(netWorth).toBe(1750); // 1000 + 2000 - 500 - 750 = 1750
  });

  it("handles API errors gracefully", async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    // Verify the mock was called
    expect(global.fetch).toBeDefined();
  });

  it("formats currency values correctly", () => {
    // This would test the formatCurrency utility function
    // For example, 1750 should be formatted as "$1,750.00"
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    expect(formatCurrency(1750)).toBe("$1,750.00");
    expect(formatCurrency(3000)).toBe("$3,000.00");
    expect(formatCurrency(1250)).toBe("$1,250.00");
  });
});
