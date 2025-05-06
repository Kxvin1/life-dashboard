"use client";

import { useState, useEffect, useRef } from "react";
import { Transaction } from "@/types/finance";
import Cookies from "js-cookie";
import { formatDateWithTimezoneOffset, formatCurrency } from "@/lib/utils";
import {
  TransactionType,
  PaymentMethod,
} from "@/components/finance/TransactionForm";
import CategorySelect from "./CategorySelect";

interface TransactionDetailPanelProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onTransactionUpdated: () => void;
}

const TransactionDetailPanel = ({
  transaction,
  isOpen,
  onClose,
  onTransactionUpdated,
}: TransactionDetailPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Local copy of the transaction that we can update
  const [localTransaction, setLocalTransaction] = useState<Transaction | null>(
    null
  );

  // Form state
  const [amount, setAmount] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("income");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");

  // Initialize form with transaction data
  useEffect(() => {
    if (transaction) {
      // Update local transaction copy
      setLocalTransaction(transaction);

      // Initialize form fields
      setAmount(transaction.amount);
      setDescription(transaction.description);
      setType(transaction.type as TransactionType);
      setPaymentMethod(transaction.payment_method as PaymentMethod);
      setDate(transaction.date.split("T")[0]);
      setCategoryId(
        transaction.category?.id ? parseInt(transaction.category.id) : null
      );
      setNotes(transaction.notes || "");
      setHasChanges(false);
    }
  }, [transaction]);

  // Reset panel state when closed
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        // Handle normal panel closing
        if (hasChanges) {
          // Show confirmation before closing
          if (
            window.confirm(
              "You have unsaved changes. Are you sure you want to close?"
            )
          ) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, hasChanges]);

  // Track form changes
  useEffect(() => {
    if (localTransaction) {
      const hasFormChanges =
        amount !== localTransaction.amount ||
        description !== localTransaction.description ||
        type !== localTransaction.type ||
        paymentMethod !== localTransaction.payment_method ||
        date !== localTransaction.date.split("T")[0] ||
        categoryId !==
          (localTransaction.category?.id
            ? parseInt(localTransaction.category.id)
            : null) ||
        notes !== (localTransaction.notes || "");

      setHasChanges(hasFormChanges);
    }
  }, [
    amount,
    description,
    type,
    paymentMethod,
    date,
    categoryId,
    notes,
    localTransaction,
  ]);

  const handleUpdateTransaction = async () => {
    if (!transaction || !localTransaction) return;

    setIsLoading(true);
    setError(null);

    try {
      // Only include fields that have changed
      const updateData: Record<string, any> = {};

      // Check each field and only include it if it's changed
      if (amount !== localTransaction.amount) {
        updateData.amount =
          typeof amount === "string" ? parseFloat(amount) : amount;
      }

      if (description !== localTransaction.description) {
        updateData.description = description;
      }

      if (type !== localTransaction.type) {
        updateData.type = type;
      }

      if (paymentMethod !== localTransaction.payment_method) {
        updateData.payment_method = paymentMethod;
      }

      // Only include date if it's changed
      if (date !== localTransaction.date.split("T")[0]) {
        // Send the date as is - the backend will handle the conversion
        updateData.date = date;
      }

      // Handle category_id (could be null)
      const originalCategoryId = localTransaction.category?.id
        ? parseInt(localTransaction.category.id)
        : null;
      if (categoryId !== originalCategoryId) {
        updateData.category_id = categoryId;
      }

      // Handle notes (could be null)
      if (notes !== (localTransaction.notes || "")) {
        updateData.notes = notes;
      }

      // Add these fields only if we're actually updating something
      if (Object.keys(updateData).length > 0) {
        // These fields are required by the backend schema
        updateData.is_recurring = false;
        updateData.recurring_frequency = null;
      }

      // Convert string ID to number if needed
      const transactionId =
        typeof transaction.id === "string"
          ? parseInt(transaction.id, 10)
          : transaction.id;

      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${transactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      let updatedTransaction;

      if (!response.ok) {
        let errorData;
        try {
          // Try to parse as JSON first
          errorData = await response.json();

          // Check if it's a date format error
          if (
            (errorData.detail &&
              typeof errorData.detail === "string" &&
              errorData.detail.includes("date")) ||
            (Array.isArray(errorData.detail) &&
              errorData.detail.some(
                (err) => err.loc && err.loc.includes("date")
              ))
          ) {
            throw new Error(
              "Invalid date format. Please use YYYY-MM-DD format."
            );
          }

          throw new Error(
            `Failed to update transaction: ${JSON.stringify(errorData)}`
          );
        } catch (e) {
          // If JSON parsing fails, try to get as text
          if (
            !(e instanceof Error) ||
            !e.message.includes("Invalid date format")
          ) {
            try {
              errorData = await response.text();
            } catch {
              errorData = "Unknown error";
            }
          }
          throw e instanceof Error
            ? e
            : new Error(`Failed to update transaction: ${errorData}`);
        }
      } else {
        // Get the updated transaction data from the response
        updatedTransaction = await response.json();
      }

      // Update the local transaction copy
      setLocalTransaction(updatedTransaction);

      // Update the form state with the response data
      setAmount(updatedTransaction.amount);
      setDescription(updatedTransaction.description);
      setType(updatedTransaction.type as TransactionType);
      setPaymentMethod(updatedTransaction.payment_method as PaymentMethod);
      setDate(updatedTransaction.date.split("T")[0]);
      setCategoryId(
        updatedTransaction.category?.id
          ? parseInt(updatedTransaction.category.id)
          : null
      );
      setNotes(updatedTransaction.notes || "");

      // Update the transaction in the parent component
      setIsEditing(false);
      setHasChanges(false);
      onTransactionUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transaction || !localTransaction) {
      setError("No transaction to delete");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the transaction ID
      const transactionId = localTransaction.id;

      // Get the token
      const token = Cookies.get("token");
      if (!token) {
        setError("Authentication token missing");
        return;
      }

      // Use the regular DELETE endpoint
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = `${baseUrl}/api/v1/transactions/${transactionId}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete transaction: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Refresh the data in the parent component
      onTransactionUpdated();

      // Close the panel
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !transaction || !localTransaction) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <div
          ref={panelRef}
          className="relative w-screen max-w-md transition-all duration-300 ease-in-out transform"
          style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className="flex flex-col h-full overflow-y-auto border-l shadow-xl bg-card border-border">
            {/* Header */}
            <div className="px-4 py-6 border-b sm:px-6 border-border">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {isEditing ? "Edit Transaction" : "Transaction Details"}
                </h2>
                <button
                  type="button"
                  className="rounded-md bg-card text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => {
                    // Handle panel closing
                    if (hasChanges) {
                      if (
                        window.confirm(
                          "You have unsaved changes. Are you sure you want to close?"
                        )
                      ) {
                        onClose();
                      }
                    } else {
                      onClose();
                    }
                  }}
                >
                  <span className="sr-only">Close panel</span>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 px-4 py-6 sm:px-6">
              {error && (
                <div className="p-3 mb-4 border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
                  {error}
                </div>
              )}

              {isEditing ? (
                // Edit form
                <div className="space-y-4">
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
                        setAmount(e.target.value);
                      }}
                      step="0.01"
                      min="0"
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
                      required
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
                      onChange={(e) =>
                        setType(e.target.value as TransactionType)
                      }
                      className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="payment_method"
                      className="block text-sm font-medium text-foreground"
                    >
                      Payment Method
                    </label>
                    <select
                      id="payment_method"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
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

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Category
                    </label>
                    <CategorySelect
                      selectedCategoryId={categoryId}
                      onCategoryChange={setCategoryId}
                      transactionType={type}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-foreground"
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="flex pt-4 space-x-2">
                    <button
                      type="button"
                      onClick={handleUpdateTransaction}
                      disabled={isLoading || !hasChanges}
                      className="flex-1 px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium border rounded-md shadow-sm text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View details
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">
                      {localTransaction.description}
                    </h3>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        localTransaction.type === "income"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {localTransaction.type.charAt(0).toUpperCase() +
                        localTransaction.type.slice(1)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <dl className="divide-y divide-border">
                      <div className="flex justify-between py-3">
                        <dt className="text-sm font-medium text-muted-foreground">
                          Amount
                        </dt>
                        <dd
                          className={`text-sm font-semibold ${
                            localTransaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(localTransaction.amount)}
                        </dd>
                      </div>

                      <div className="flex justify-between py-3">
                        <dt className="text-sm font-medium text-muted-foreground">
                          Date
                        </dt>
                        <dd className="text-sm text-foreground">
                          {formatDateWithTimezoneOffset(localTransaction.date)}
                        </dd>
                      </div>

                      <div className="flex justify-between py-3">
                        <dt className="text-sm font-medium text-muted-foreground">
                          Category
                        </dt>
                        <dd className="text-sm text-foreground">
                          {localTransaction.category?.name || "Uncategorized"}
                        </dd>
                      </div>

                      <div className="flex justify-between py-3">
                        <dt className="text-sm font-medium text-muted-foreground">
                          Payment Method
                        </dt>
                        <dd className="text-sm text-foreground">
                          {localTransaction.payment_method
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </dd>
                      </div>

                      {localTransaction.notes && (
                        <div className="py-3">
                          <dt className="mb-1 text-sm font-medium text-muted-foreground">
                            Notes
                          </dt>
                          <dd className="mt-1 text-sm whitespace-pre-wrap text-foreground">
                            {localTransaction.notes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="flex pt-4 space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 px-4 py-2 text-sm font-medium border border-transparent rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-medium text-center border rounded-md shadow-sm text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                      onClick={handleDeleteTransaction}
                      disabled={isLoading}
                    >
                      {isLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailPanel;
