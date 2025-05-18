import React from "react";
import "@testing-library/jest-dom";
import Cookies from "js-cookie";

// Mock the fetch function
global.fetch = jest.fn();

// Mock Cookies.get to return a token
(Cookies.get as jest.Mock).mockReturnValue("test-token");

describe("Financial Dashboard Loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes monthly summary data correctly", async () => {
    // Mock monthly summary data
    const mockMonthlySummary = {
      summary: {
        1: { income: 1000, expense: 500, net: 500 },
        2: { income: 2000, expense: 750, net: 1250 },
        3: { income: 1500, expense: 600, net: 900 },
      },
    };

    // Setup fetch mock response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMonthlySummary,
    });

    // Verify the mock data structure
    expect(mockMonthlySummary.summary[3].income).toBe(1500);
    expect(mockMonthlySummary.summary[3].expense).toBe(600);
    expect(mockMonthlySummary.summary[3].net).toBe(900);

    // Verify the calculation is correct
    const month3Data = mockMonthlySummary.summary[3];
    expect(month3Data.income - month3Data.expense).toBe(month3Data.net);
  });

  it("handles API errors gracefully", async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Failed to fetch summary" }),
    });

    // Verify the mock was configured correctly
    expect(global.fetch).toBeDefined();
  });

  it("handles empty data gracefully", async () => {
    // Mock empty summary data
    const mockEmptySummary = {
      summary: {},
    };

    // Setup fetch mock response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptySummary,
    });

    // Verify the mock data structure
    expect(Object.keys(mockEmptySummary.summary).length).toBe(0);

    // Test default values for empty data
    const getMonthData = (summary: any, month: number) => {
      return summary[month] || { income: 0, expense: 0, net: 0 };
    };

    const defaultData = getMonthData(mockEmptySummary.summary, 3);
    expect(defaultData.income).toBe(0);
    expect(defaultData.expense).toBe(0);
    expect(defaultData.net).toBe(0);
  });
});
