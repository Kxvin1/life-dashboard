"use client";

import { useState } from "react";
import TransactionForm from "@/components/finance/TransactionForm";
import TransactionList from "@/components/finance/TransactionListDark";
import TransactionSummary from "@/components/finance/TransactionSummary";
import BackToHome from "@/components/common/BackToHome";

const TransactionsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6">
      <div className="mx-auto space-y-6 max-w-7xl">
        {/* Back to Home button */}
        <div className="mb-4">
          <BackToHome />
        </div>

        {/* Header */}
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Income & Expenses
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Track your income and expenses
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Summary
          </h2>
          <TransactionSummary
            key={`summary-${refreshKey}`}
            year={new Date().getFullYear()}
            month={null}
            categoryId={null}
          />
        </div>

        {/* Transaction Form */}
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Add Transaction
          </h2>
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>

        {/* Transaction List */}
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Recent Transactions
          </h2>
          <TransactionList key={`list-${refreshKey}`} />
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
