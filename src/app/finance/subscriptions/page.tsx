"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "@/components/common/BackToHome";
import SubscriptionForm from "@/components/finance/SubscriptionForm";
import SubscriptionTabs from "@/components/finance/SubscriptionTabs";
import SubscriptionSummary from "@/components/finance/SubscriptionSummary";
import Toast from "@/components/ui/Toast";
import { SubscriptionStatus } from "@/types/finance";

const SubscriptionsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activeTab, setActiveTab] = useState<SubscriptionStatus>("active");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubscriptionAdded = () => {
    setShowAddForm(false);
    setShowSuccessToast(true);
    // Cache invalidation is handled by the service
  };

  const handleSubscriptionDeleted = () => {
    // Cache invalidation is handled by the service
  };

  const handleSubscriptionToggled = () => {
    // Cache invalidation is handled by the service
  };

  const handleTabChange = (tab: SubscriptionStatus) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Back to Home button */}
      <div className="mb-4">
        <BackToHome />
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden p-6 mb-6 border shadow-md lg:block bg-card rounded-xl border-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Subscription Tracker
            </h2>
            <p className="text-muted-foreground">
              Track your recurring subscription payments and never miss a due
              date.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:bg-primary/90 whitespace-nowrap"
          >
            Add Subscription
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Subscription Summary - Shown first on mobile, right side on desktop */}
        <div className="order-first lg:order-last lg:col-span-1">
          <SubscriptionSummary />
        </div>

        {/* Mobile Add Subscription Form - Only visible on mobile, shown BEFORE the header */}
        {showAddForm && (
          <div className="block p-6 mb-6 border shadow-md lg:hidden bg-card rounded-xl border-border">
            <h3 className="mb-4 text-lg font-medium text-foreground">
              Add New Subscription
            </h3>
            <SubscriptionForm
              onSubscriptionAdded={handleSubscriptionAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Mobile Header - Only visible on mobile, shown after subscription summary */}
        <div className="block p-6 mb-6 border shadow-md lg:hidden bg-card rounded-xl border-border">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Subscription Tracker
              </h2>
              <p className="text-muted-foreground">
                Track your recurring subscription payments and never miss a due
                date.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:bg-primary/90 whitespace-nowrap"
            >
              Add Subscription
            </button>
          </div>
        </div>

        {/* Subscription List - Shown after form on mobile, left side on desktop */}
        <div className="order-last space-y-6 lg:order-first lg:col-span-2">
          {/* Desktop Add Subscription Form - Only visible on desktop, shown at the top */}
          {showAddForm && (
            <div className="hidden p-6 mb-6 border shadow-md lg:block bg-card rounded-xl border-border">
              <h3 className="mb-4 text-lg font-medium text-foreground">
                Add New Subscription
              </h3>
              <SubscriptionForm
                onSubscriptionAdded={handleSubscriptionAdded}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          <div className="p-6 border shadow-md bg-card rounded-xl border-border">
            <SubscriptionTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onSubscriptionDeleted={handleSubscriptionDeleted}
              onSubscriptionToggled={handleSubscriptionToggled}
            />
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          message="Subscription added successfully!"
          type="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default SubscriptionsPage;
