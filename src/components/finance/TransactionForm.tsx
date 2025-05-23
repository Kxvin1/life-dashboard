"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import CategorySelect from "./CategorySelect";
import { cacheManager } from "@/lib/cacheManager";
import { createTransaction } from "@/services/transactionService";

interface TransactionFormProps {
  onTransactionAdded: (type: TransactionType) => void;
}

export type TransactionType = "income" | "expense";
export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "other";

const TransactionForm = ({ onTransactionAdded }: TransactionFormProps) => {
  const [amount, setAmount] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("income");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate amount
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (numAmount > 999999999999) {
      setError("Amount cannot exceed 999 billion");
      return;
    }

    setIsLoading(true);

    // Get the token
    const token = Cookies.get("token");
    if (!token) {
      setError("Authentication token missing");
      setIsLoading(false);
      return;
    }

    // Create the request data
    const requestData = {
      amount: numAmount,
      description,
      type,
      payment_method: paymentMethod,
      date,
      category_id: categoryId,
      is_recurring: false,
      recurring_frequency: null,
    };

    // Use the transaction service with caching and deduplication
    try {
      await createTransaction(requestData);

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId(null);

      // Set success message
      const typeLabel = type === "income" ? "Income" : "Expense";
      setSuccess(`${typeLabel} transaction added successfully!`);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);

      // Notify parent component with the transaction type
      onTransactionAdded(type);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-foreground"
        >
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => {
            // Limit the amount to 999 billion and ensure it's greater than 0
            const value = parseFloat(e.target.value);
            if (e.target.value === "") {
              setAmount("");
            } else if (!isNaN(value) && value > 0 && value <= 999999999999) {
              setAmount(e.target.value);
            }
          }}
          step="0.01"
          min="0.01"
          max="999999999999"
          placeholder="Enter amount (greater than 0)"
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Optional description"
        />
      </div>

      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-foreground"
        >
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as TransactionType);
            setCategoryId(null); // Reset category when type changes
          }}
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="income" className="text-green-600">
            Income
          </option>
          <option value="expense" className="text-red-600">
            Expense
          </option>
        </select>
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-foreground"
        >
          Category
        </label>
        <CategorySelect
          value={categoryId}
          onChange={setCategoryId}
          transactionType={type}
        />
      </div>

      <div>
        <label
          htmlFor="paymentMethod"
          className="block text-sm font-medium text-foreground"
        >
          Payment Method
        </label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-foreground"
        >
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex justify-center w-full px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
      >
        {isLoading ? "Adding..." : "Add Transaction"}
      </button>
    </form>
  );
};

export default TransactionForm;
