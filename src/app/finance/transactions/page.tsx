"use client";

import TransactionForm from "@/components/finance/TransactionForm";
import BackToHome from "@/components/common/BackToHome";

const TransactionsPage = () => {
  const handleTransactionAdded = () => {
    // This function is kept for future use if needed
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
            Add Transaction
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Record your income and expenses
          </p>
        </div>

        {/* Transaction Form */}
        <div className="p-6 border shadow-md bg-card rounded-xl border-border">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Transaction Details
          </h2>
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
