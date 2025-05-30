"use client";

import { useState, useEffect } from "react";
import { Subscription, BillingFrequency, SubscriptionStatus } from "@/types/finance";
import { updateSubscription } from "@/services/subscriptionService";

interface SubscriptionEditModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated: () => void;
}

const SubscriptionEditModal = ({
  subscription,
  isOpen,
  onClose,
  onSubscriptionUpdated,
}: SubscriptionEditModalProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with subscription data
  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount);
      setBillingFrequency(subscription.billing_frequency);
      setStartDate(subscription.start_date);
      setStatus(subscription.status);
      setNotes(subscription.notes || "");
    }
  }, [subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await updateSubscription(subscription.id, {
        name,
        amount: typeof amount === "string" ? parseFloat(amount) : amount,
        billing_frequency: billingFrequency,
        start_date: startDate,
        status,
        notes: notes || null,
      });

      onSubscriptionUpdated();
      onClose();
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

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-card rounded-lg shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground">
              Edit Subscription
            </h3>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-foreground">
                Service Name
              </label>
              <input
                type="text"
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-amount" className="block text-sm font-medium text-foreground">
                Price
              </label>
              <input
                type="number"
                id="edit-amount"
                value={amount}
                onChange={(e) => {
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
                className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-billing-frequency" className="block text-sm font-medium text-foreground">
                Billing Frequency
              </label>
              <select
                id="edit-billing-frequency"
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-start-date" className="block text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                type="date"
                id="edit-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="edit-notes" className="block text-sm font-medium text-foreground">
                  Notes (Optional)
                </label>
                <span className="text-xs text-muted-foreground">
                  {notes.length}/100 characters
                </span>
              </div>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => {
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

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background text-foreground hover:bg-muted"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Subscription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionEditModal;
