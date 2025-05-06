"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/types/finance";
import { sortTransactionsByDate } from "@/lib/utils";

interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}

interface YearlySummary {
  total_income: number;
  total_expense: number;
  net_income: number;
}

interface OverviewSummaryProps {
  year: number;
  month: number | null;
  categoryId: number | null;
  viewMode: "monthly" | "yearly";
  onMonthSelect: (month: number) => void;
}

export default function OverviewSummary({
  year,
  month,
  categoryId,
  viewMode,
  onMonthSelect,
}: OverviewSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<
    Record<number, MonthlySummary>
  >({});
  const [yearlyData, setYearlyData] = useState<YearlySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get("token");

        if (viewMode === "monthly") {
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

          if (!response.ok) throw new Error("Failed to fetch monthly summary");
          const data = await response.json();
          setMonthlyData(data.summary);
        } else {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL
            }/api/v1/summaries/yearly?year=${year}${
              categoryId ? `&category_id=${categoryId}` : ""
            }`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch yearly summary");
          const data = await response.json();
          setYearlyData(data);
        }

        const transactionsResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/v1/transactions/?year=${year}${month ? `&month=${month}` : ""}${
            categoryId ? `&category_id=${categoryId}` : ""
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!transactionsResponse.ok)
          throw new Error("Failed to fetch transactions");
        const transactionsData = await transactionsResponse.json();
        // Sort transactions by date in descending order (newest first)
        const sortedTransactions = sortTransactionsByDate(transactionsData);
        setTransactions(sortedTransactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, categoryId, viewMode]);

  if (loading) {
    return (
      <div className="bg-card/70 backdrop-blur-lg rounded-xl border border-border shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-secondary rounded w-3/4"></div>
          <div className="h-4 bg-secondary rounded"></div>
          <div className="h-4 bg-secondary rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card/70 backdrop-blur-lg rounded-xl border border-border shadow-md p-6">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  const renderSummary = () => {
    if (viewMode === "monthly") {
      if (month) {
        const monthData = monthlyData[month] || {
          income: 0,
          expense: 0,
          net: 0,
        };
        return (
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100/10 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {new Date(year, month - 1).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button
                  onClick={() => onMonthSelect(0)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors duration-200 shadow-sm hover:shadow-md active:scale-95 transform"
                >
                  <svg
                    className="h-4 w-4 mr-1.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to All Months
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Income
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(monthData.income)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-6 border border-red-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Expenses
                  </h3>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(monthData.expense)}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-6 border ${
                    monthData.net >= 0
                      ? "bg-green-50 border-green-100"
                      : "bg-red-50 border-red-100"
                  }`}
                >
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Net Income
                  </h3>
                  <p
                    className={`text-3xl font-bold ${
                      monthData.net >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(monthData.net)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100/10 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {year} Monthly Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(monthlyData).map(([monthNum, data]) => (
                  <div
                    key={monthNum}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onMonthSelect(Number(monthNum))}
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      {new Date(year, Number(monthNum) - 1).toLocaleString(
                        "default",
                        { month: "long" }
                      )}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Income</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(data.income)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Expenses</span>
                        <span className="text-red-600 font-medium">
                          {formatCurrency(data.expense)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-700">
                          Net Income
                        </span>
                        <span
                          className={`font-medium ${
                            data.net >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(data.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100/10 backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {year} Yearly Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Total Income
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(yearlyData?.total_income || 0)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Total Expenses
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(yearlyData?.total_expense || 0)}
                </p>
              </div>
              <div
                className={`rounded-lg p-6 border ${
                  (yearlyData?.net_income || 0) >= 0
                    ? "bg-green-50 border-green-100"
                    : "bg-red-50 border-red-100"
                }`}
              >
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Net Income
                </h3>
                <p
                  className={`text-3xl font-bold ${
                    (yearlyData?.net_income || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(yearlyData?.net_income || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderTransactions = () => {
    if (transactions.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100/10 backdrop-blur-sm">
          <div className="p-6">
            <p className="text-gray-500 text-center">No transactions found</p>
          </div>
        </div>
      );
    }

    // Filter transactions by month if a specific month is selected
    const filteredTransactions = month
      ? transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() + 1 === month;
        })
      : transactions;

    if (filteredTransactions.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100/10 backdrop-blur-sm">
          <div className="p-6">
            <p className="text-gray-500 text-center">
              No transactions found for the selected month
            </p>
          </div>
        </div>
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil(
      filteredTransactions.length / transactionsPerPage
    );
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      startIndex + transactionsPerPage
    );

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Transaction History
            </h2>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span> -{" "}
                  <span className="font-medium">
                    {Math.min(
                      startIndex + transactionsPerPage,
                      filteredTransactions.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {filteredTransactions.length}
                  </span>
                </p>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.category?.name || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span
                        className={
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {renderSummary()}
        {renderTransactions()}
      </div>
    </div>
  );
}
