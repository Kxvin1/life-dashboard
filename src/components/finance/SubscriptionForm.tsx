"use client";

import { useState } from "react";
import { BillingFrequency, SubscriptionStatus } from "@/types/finance";
import { createSubscription } from "@/services/subscriptionService";

interface SubscriptionFormProps {
  onSubscriptionAdded: () => void;
  onCancel: () => void;
}

const SubscriptionForm = ({
  onSubscriptionAdded,
  onCancel,
}: SubscriptionFormProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [billingFrequency, setBillingFrequency] =
    useState<BillingFrequency>("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await createSubscription({
        name,
        amount: typeof amount === "string" ? parseFloat(amount) : amount,
        billing_frequency: billingFrequency,
        start_date: startDate,
        status,
        notes: notes || null,
        next_payment_date: null,
        last_active_date: null,
      });

      // Reset form
      setName("");
      setAmount("");
      setBillingFrequency("monthly");
      setStartDate(new Date().toISOString().split("T")[0]);
      setStatus("active");
      setNotes("");

      // Notify parent component
      onSubscriptionAdded();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          Service Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Netflix, Spotify, etc."
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-foreground"
        >
          Price
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => {
            // Limit the amount to 1 billion
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value <= 1000000000) {
              setAmount(e.target.value);
            } else if (e.target.value === "") {
              setAmount("");
            }
          }}
          step="0.01"
          min="0"
          max="1000000000"
          placeholder="Enter amount (max $1 billion)"
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="billingFrequency"
          className="block text-sm font-medium text-foreground"
        >
          Billing Frequency
        </label>
        <select
          id="billingFrequency"
          value={billingFrequency}
          onChange={(e) =>
            setBillingFrequency(e.target.value as BillingFrequency)
          }
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="quarterly">Quarterly</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-foreground"
        >
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-foreground"
        >
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-foreground"
          >
            Notes (Optional)
          </label>
          <span className="text-xs text-muted-foreground">
            {notes.length}/100 characters
          </span>
        </div>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => {
            // Limit to 100 characters
            if (e.target.value.length <= 100) {
              setNotes(e.target.value);
            }
          }}
          placeholder="Additional information (max 100 chars)"
          className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          rows={3}
          maxLength={100}
        />
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : "Add Subscription"}
        </button>
      </div>
    </form>
  );
};

export default SubscriptionForm;
