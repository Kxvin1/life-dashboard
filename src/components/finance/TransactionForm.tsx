"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import CategorySelect from "./CategorySelect";

interface TransactionFormProps {
  onTransactionAdded: () => void;
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      amount: typeof amount === "string" ? parseFloat(amount) || 0 : amount,
      description,
      type,
      payment_method: paymentMethod,
      date,
      category_id: categoryId,
      is_recurring: false,
      recurring_frequency: null,
    };

    // Create a direct XMLHttpRequest for maximum compatibility
    const xhr = new XMLHttpRequest();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/v1/transactions/`;

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Reset form
          setAmount("");
          setDescription("");
          setCategoryId(null);

          // Notify parent component
          onTransactionAdded();
        } else {
          setError(
            `Failed to create transaction: ${xhr.statusText || "Unknown error"}`
          );
        }

        setIsLoading(false);
      }
    };

    xhr.onerror = function () {
      setError("Network error occurred");
      setIsLoading(false);
    };

    // Send the request
    xhr.send(JSON.stringify(requestData));
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
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0"
          placeholder="Enter amount"
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
