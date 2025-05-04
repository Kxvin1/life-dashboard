"use client";

import { useState } from "react";
import TransactionForm from "@/components/finance/TransactionForm";
import TransactionList from "@/components/finance/TransactionListDark";
import TransactionSummary from "@/components/finance/TransactionSummary";

const FinancePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl border border-border shadow-md p-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Finance Dashboard
          </h1>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">
            Track your income and expenses
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-card rounded-xl border border-border shadow-md p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
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
        <div className="bg-card rounded-xl border border-border shadow-md p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Add Transaction
          </h2>
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>

        {/* Transaction List */}
        <div className="bg-card rounded-xl border border-border shadow-md p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Recent Transactions
          </h2>
          <TransactionList key={`list-${refreshKey}`} />
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
