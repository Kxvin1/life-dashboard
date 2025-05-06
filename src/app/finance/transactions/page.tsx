"use client";

import { useState } from "react";
import TransactionForm from "@/components/finance/TransactionForm";
import BackToHome from "@/components/common/BackToHome";
import Toast from "@/components/ui/Toast";

const TransactionsPage = () => {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income"
  );

  const handleTransactionAdded = (type: "income" | "expense") => {
    setTransactionType(type);
    setShowSuccessToast(true);
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

        {/* Success Toast */}
        {showSuccessToast && (
          <Toast
            message={`${
              transactionType === "income" ? "Income" : "Expense"
            } transaction added successfully!`}
            type="success"
            duration={5000}
            onClose={() => setShowSuccessToast(false)}
            actionLabel="View in Overview"
            actionHref="/finance/overview"
          />
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
