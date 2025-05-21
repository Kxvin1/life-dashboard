"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Transaction } from "@/types/finance";
import {
  sortTransactionsByDate,
  formatDateWithTimezoneOffset,
} from "@/lib/utils";

const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      const token = Cookies.get("token");

      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?_=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      // Sort transactions by date in descending order (newest first)
      const sortedTransactions = sortTransactionsByDate(data);
      setTransactions(sortedTransactions);
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Use the shared utility function for date formatting
  const formatDate = formatDateWithTimezoneOffset;

  const formatAmount = (amount: number, type: "income" | "expense") => {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    return type === "income" ? formattedAmount : `-${formattedAmount}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="w-3/4 h-4 rounded bg-secondary"></div>
        <div className="h-4 rounded bg-secondary"></div>
        <div className="w-1/2 h-4 rounded bg-secondary"></div>
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

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center border bg-card/70 backdrop-blur-sm rounded-xl border-border">
        <p className="text-muted-foreground">
          No transactions found. Add your first transaction above!
        </p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const paginatedTransactions = transactions.slice(
    startIndex,
    startIndex + transactionsPerPage
  );

  return (
    <div className="overflow-hidden border rounded-xl border-border">
      {/* Table Header with Pagination */}
      <div className="px-6 py-4 border-b bg-card border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Transaction History
          </h2>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                <span className="font-medium">{startIndex + 1}</span> -{" "}
                <span className="font-medium">
                  {Math.min(
                    startIndex + transactionsPerPage,
                    transactions.length
                  )}
                </span>{" "}
                of <span className="font-medium">{transactions.length}</span>
              </p>

              {/* Simplified mobile pagination */}
              <div className="flex justify-center sm:justify-start">
                <nav
                  className="inline-flex rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-md border border-border bg-card text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* First page button - always visible on desktop */}
                  {currentPage > 2 && (
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="hidden sm:inline-flex relative items-center px-4 py-2 border border-border bg-card text-sm font-medium text-foreground hover:bg-accent/50"
                    >
                      1
                    </button>
                  )}

                  {/* Ellipsis - shown when needed on desktop */}
                  {currentPage > 3 && (
                    <span className="hidden sm:inline-flex relative items-center px-4 py-2 border border-border bg-card text-sm font-medium text-muted-foreground">
                      ...
                    </span>
                  )}

                  {/* Current page indicator - always visible */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-primary/30 bg-primary/10 text-sm font-medium text-primary">
                    {currentPage} of {totalPages}
                  </span>

                  {/* Ellipsis - shown when needed on desktop */}
                  {currentPage < totalPages - 2 && (
                    <span className="hidden sm:inline-flex relative items-center px-4 py-2 border border-border bg-card text-sm font-medium text-muted-foreground">
                      ...
                    </span>
                  )}

                  {/* Last page button - always visible on desktop */}
                  {currentPage < totalPages - 1 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="hidden sm:inline-flex relative items-center px-4 py-2 border border-border bg-card text-sm font-medium text-foreground hover:bg-accent/50"
                    >
                      {totalPages}
                    </button>
                  )}

                  {/* Next button */}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-r-md border border-border bg-card text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
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
            </div>
          )}
        </div>
      </div>

      {/* Rest of the table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                Description
              </th>
              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                Category
              </th>
              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left uppercase text-muted-foreground">
                Type
              </th>
              <th className="px-6 py-4 text-xs font-medium tracking-wider text-right uppercase text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y bg-card divide-border">
            {paginatedTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition-colors duration-150 hover:bg-accent/30"
              >
                <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                  {transaction.category?.name || "Uncategorized"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === "income"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transaction.type.charAt(0).toUpperCase() +
                      transaction.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <span
                    className={
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
