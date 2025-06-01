"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Subscription, SubscriptionStatus } from "@/types/finance";
import {
  fetchSubscriptionsPaginated,
  deleteSubscription,
  toggleSubscriptionStatus,
} from "@/services/subscriptionService";
import {
  formatCurrency,
  formatSubscriptionDuration,
  truncateText,
} from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import { cacheManager } from "@/lib/cacheManager";
import SubscriptionEditModal from "./SubscriptionEditModal";

interface SubscriptionListProps {
  status: SubscriptionStatus;
  onSubscriptionDeleted: () => void;
  onSubscriptionToggled?: () => void;
  sortField: "name" | "price" | "upcoming";
  sortDirection: "asc" | "desc";
}

const SubscriptionList = ({
  status,
  onSubscriptionToggled,
  sortField,
  sortDirection,
}: SubscriptionListProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);
  const [subscriptionToToggle, setSubscriptionToToggle] = useState<{
    id: string;
    status: SubscriptionStatus;
  } | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [upcomingPaymentIds, setUpcomingPaymentIds] = useState<string[]>([]);
  const [subscriptionToEdit, setSubscriptionToEdit] =
    useState<Subscription | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Infinite scroll refs
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Format date for display with Pacific Time (PT) adjustment
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";

    // Parse the date string directly without timezone conversion
    // Format: YYYY-MM-DD
    const [year, month, day] = dateString
      .split("-")
      .map((num) => parseInt(num, 10));

    // Create a date string with the exact values (no timezone adjustment)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "America/Los_Angeles", // Pacific Time
    };

    // Create a date with the exact values from the input
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, options);
  };

  // Check if a date is in the future
  const isFutureDate = (dateString: string | null) => {
    if (!dateString) return false;

    // Parse the date string
    const [year, month, day] = dateString
      .split("-")
      .map((num) => parseInt(num, 10));

    // Create date objects without time components for accurate comparison
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return inputDate > todayWithoutTime;
  };

  // Format billing frequency for display
  const formatBillingFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  // Load subscriptions with infinite scroll
  const loadSubscriptions = useCallback(
    async (pageNum: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetchSubscriptionsPaginated(pageNum, 10, status);

        // Sort the subscriptions based on the sortField and sortDirection props
        const sortedData = [...response.items].sort((a, b) => {
          let comparison = 0;

          if (sortField === "price") {
            comparison = a.amount - b.amount;
          } else if (sortField === "upcoming" && status === "active") {
            // Get the effective date for each subscription (next payment date or start date for future ones)
            const getEffectiveDate = (sub: Subscription) => {
              if (isFutureDate(sub.start_date)) {
                return new Date(sub.start_date).getTime();
              } else {
                return sub.next_payment_date
                  ? new Date(sub.next_payment_date).getTime()
                  : Infinity;
              }
            };

            const dateA = getEffectiveDate(a);
            const dateB = getEffectiveDate(b);

            // Sort by the effective date (ascending - closest date first)
            comparison = dateA - dateB;
          } else {
            comparison = a.name.localeCompare(b.name);
          }

          // Reverse the comparison if sorting in descending order
          return sortDirection === "asc" ? comparison : -comparison;
        });

        setSubscriptions((prev) =>
          pageNum === 1 ? sortedData : [...prev, ...sortedData]
        );
        setTotalCount(response.total);
        setHasMore(response.has_more);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [status, sortField, sortDirection]
  );

  // Function to get upcoming payment IDs
  const loadUpcomingPayments = async () => {
    if (status === "active") {
      try {
        // Get multiple pages to ensure we have enough data for sorting
        // Start with a reasonable limit and fetch more if needed
        let allSubscriptions: Subscription[] = [];
        let page = 1;
        let hasMore = true;

        // Fetch up to 5 pages (50 items) to get enough data for upcoming payments
        while (hasMore && page <= 5) {
          const response = await fetchSubscriptionsPaginated(
            page,
            10,
            "active"
          );
          allSubscriptions = [...allSubscriptions, ...response.items];
          hasMore = response.has_more;
          page++;
        }

        // Sort them by next payment date (or start date for future ones)
        const sortedSubscriptions = [...allSubscriptions].sort((a, b) => {
          // Get the effective date for each subscription
          const getEffectiveDate = (sub: Subscription) => {
            if (isFutureDate(sub.start_date)) {
              return new Date(sub.start_date).getTime();
            } else {
              return sub.next_payment_date
                ? new Date(sub.next_payment_date).getTime()
                : Infinity;
            }
          };

          const dateA = getEffectiveDate(a);
          const dateB = getEffectiveDate(b);

          // Sort by the effective date (ascending - closest date first)
          return dateA - dateB;
        });

        // Get the IDs of the next 3 upcoming payments
        const upcomingIds = sortedSubscriptions
          .slice(0, 3)
          .map((sub) => sub.id);
        setUpcomingPaymentIds(upcomingIds);
      } catch (error) {
        // Silently handle error - we don't want to break the UI if this fails
        console.warn("Failed to load upcoming payments:", error);
        setUpcomingPaymentIds([]);
      }
    } else {
      // Clear upcoming payment IDs if we're on the inactive tab
      setUpcomingPaymentIds([]);
    }
  };

  // Initial load and reset when dependencies change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setSubscriptions([]);
    loadSubscriptions(1);
    loadUpcomingPayments();

    // Subscribe to cache invalidation events
    const unsubscribe = cacheManager.subscribe(() => {
      setPage(1);
      setHasMore(true);
      setSubscriptions([]);
      loadSubscriptions(1);
      loadUpcomingPayments();
    });

    return unsubscribe;
  }, [status, sortField, sortDirection, loadSubscriptions]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (isLoading || !hasMore) {
      return;
    }

    // Use a small delay to ensure the DOM element is rendered
    const setupObserver = () => {
      if (observer.current) {
        observer.current.disconnect();
      }

      const callback = (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      };

      observer.current = new IntersectionObserver(callback, {
        rootMargin: "100px", // Trigger 100px before the element comes into view
        threshold: 0.1,
      });

      if (loadingRef.current) {
        observer.current.observe(loadingRef.current);
      } else {
        // Retry after a short delay if ref is not ready
        setTimeout(setupObserver, 100);
      }
    };

    // Start setup immediately, but with retry logic
    setupObserver();

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [isLoading, hasMore, page]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadSubscriptions(page);
    }
  }, [page, loadSubscriptions]);

  const handleDeleteClick = (id: string) => {
    setSubscriptionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!subscriptionToDelete) return;

    try {
      await deleteSubscription(subscriptionToDelete);
      setShowDeleteConfirm(false);
      setSubscriptionToDelete(null);

      // Show success toast
      setToastMessage("Subscription deleted successfully");
      setShowToast(true);

      // Force a complete refresh of subscription data from the server
      // This ensures we don't see stale cached data
      setPage(1);
      setHasMore(true);
      setSubscriptions([]);
      await Promise.all([loadSubscriptions(1), loadUpcomingPayments()]);

      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleToggleClick = (id: string, currentStatus: SubscriptionStatus) => {
    setSubscriptionToToggle({ id, status: currentStatus });
    setShowToggleConfirm(true);
  };

  const handleConfirmToggle = async () => {
    if (!subscriptionToToggle) return;

    const { id, status } = subscriptionToToggle;

    if (isToggling) return;

    // Set toggling state
    setIsToggling(true);

    // Close the confirmation dialog immediately to improve UX
    setShowToggleConfirm(false);
    setSubscriptionToToggle(null);

    // Show a "processing" toast
    setToastMessage("Processing your request...");
    setShowToast(true);

    try {
      // Toggle the subscription status
      await toggleSubscriptionStatus(id, status);

      // Show success toast
      setToastMessage(
        `Subscription ${
          status === "active" ? "deactivated" : "activated"
        } successfully`
      );
      setShowToast(true);
    } catch (err) {
      console.error("Error toggling subscription:", err);

      // Don't show an error toast since the operation might have succeeded anyway
      // Just log the error for debugging
    }

    // Always refresh the data regardless of whether the API call succeeded or failed
    // This ensures we're showing the current state
    try {
      // First refresh the local data
      setPage(1);
      setHasMore(true);
      setSubscriptions([]);
      await loadSubscriptions(1);
      await loadUpcomingPayments();

      // Then notify parent component that a subscription was toggled
      // This will trigger the subscription summary refresh
      if (onSubscriptionToggled) {
        onSubscriptionToggled();
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.debug("Error refreshing subscriptions:", e);
      }
    }

    // Set isToggling to false
    setIsToggling(false);

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleEditClick = (subscription: Subscription) => {
    setSubscriptionToEdit(subscription);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSubscriptionToEdit(null);
  };

  const handleSubscriptionUpdated = async () => {
    // Show success toast
    setToastMessage("Subscription updated successfully");
    setShowToast(true);

    // Refresh the data
    setPage(1);
    setHasMore(true);
    setSubscriptions([]);
    await Promise.all([loadSubscriptions(1), loadUpcomingPayments()]);

    // Notify parent component
    if (onSubscriptionToggled) {
      onSubscriptionToggled();
    }

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  if (isLoading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading subscriptions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
        Error: {error}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="py-8 text-center border bg-card/70 backdrop-blur-sm rounded-xl border-border">
        <p className="text-muted-foreground">
          No {status} subscriptions found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border rounded-xl border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-card border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {status === "active" ? "Active" : "Inactive"} Subscriptions
          </h2>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">{subscriptions.length}</span> of{" "}
              <span className="font-medium">{totalCount}</span> subscriptions
            </p>
          )}
        </div>
      </div>

      {/* Sort Indicator */}
      <div className="px-6 py-3 border-t bg-card border-border">
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Sorted by: </span>
          <span className="ml-1 font-medium text-foreground">
            {sortField === "name"
              ? "Name"
              : sortField === "price"
              ? "Price"
              : "Upcoming Payments"}
          </span>
          <span className="ml-1">
            {sortField === "name"
              ? `(${sortDirection === "asc" ? "A to Z" : "Z to A"})`
              : sortField === "price"
              ? `(${sortDirection === "asc" ? "Low to High" : "High to Low"})`
              : `(${
                  sortDirection === "asc" ? "Soonest First" : "Latest First"
                })`}
          </span>
        </div>
      </div>

      {/* Card-based Layout for All Screen Sizes */}
      <div className="bg-card">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className={`bg-card border ${
                  upcomingPaymentIds.includes(subscription.id)
                    ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                    : "border-border"
                } rounded-lg p-6 xl:p-7 shadow-sm hover:bg-muted/30 transition-colors ${
                  upcomingPaymentIds.includes(subscription.id)
                    ? "bg-primary/5"
                    : ""
                }`}
              >
                {/* Service Name and Price */}
                <div className="flex items-start justify-between mb-5 gap-4">
                  <div className="flex flex-col min-w-0 flex-1">
                    <h3 className="text-lg font-medium break-words text-foreground line-clamp-2">
                      {subscription.name}
                    </h3>
                    {upcomingPaymentIds.includes(subscription.id) && (
                      <span className="mt-1 text-xs font-medium break-words text-primary">
                        {upcomingPaymentIds.indexOf(subscription.id) === 0
                          ? "Next payment due"
                          : `Payment due soon (${
                              upcomingPaymentIds.indexOf(subscription.id) + 1
                            })`}
                      </span>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-lg font-semibold text-foreground">
                    {formatCurrency(subscription.amount)}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 mb-6 text-sm gap-y-4 gap-x-4">
                  <div className="font-medium text-muted-foreground">
                    Start Date:
                  </div>
                  <div className="flex items-center overflow-hidden text-foreground">
                    <span className="min-w-0 break-words">
                      {formatDate(subscription.start_date)}
                    </span>
                    {isFutureDate(subscription.start_date) && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary flex-shrink-0">
                        Future
                      </span>
                    )}
                  </div>

                  <div className="font-medium text-muted-foreground">
                    Duration:
                  </div>
                  <div className="break-words text-foreground">
                    {formatSubscriptionDuration(subscription.start_date)}
                  </div>

                  <div className="font-medium text-muted-foreground">
                    {status === "active" ? "Next Payment:" : "Last Active:"}
                  </div>
                  <div className="overflow-hidden text-foreground">
                    {status === "active" ? (
                      isFutureDate(subscription.start_date) ? (
                        <div className="flex items-center">
                          <span className="min-w-0 break-words">
                            {formatDate(subscription.start_date)}
                          </span>
                          <span className="ml-1 px-1 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                            First
                          </span>
                        </div>
                      ) : (
                        <span className="min-w-0 break-words">
                          {formatDate(subscription.next_payment_date)}
                        </span>
                      )
                    ) : (
                      <span className="min-w-0 break-words">
                        {formatDate(subscription.last_active_date)}
                      </span>
                    )}
                  </div>

                  <div className="font-medium text-muted-foreground">
                    Frequency:
                  </div>
                  <div className="break-words text-foreground">
                    {formatBillingFrequency(subscription.billing_frequency)}
                  </div>

                  {/* Display notes if they exist */}
                  {subscription.notes && (
                    <>
                      <div className="font-medium text-muted-foreground">
                        Note:
                      </div>
                      <div
                        className="italic break-words text-foreground cursor-help"
                        title={
                          subscription.notes.length > 30
                            ? subscription.notes
                            : undefined
                        }
                      >
                        &quot;{truncateText(subscription.notes, 30)}&quot;
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-5 border-t border-border gap-4 sm:gap-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {subscription.status === "active" ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() =>
                        handleToggleClick(subscription.id, subscription.status)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        subscription.status === "active"
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                      disabled={isToggling}
                      aria-label={
                        subscription.status === "active"
                          ? "Deactivate subscription"
                          : "Activate subscription"
                      }
                    >
                      <span
                        className={`${
                          subscription.status === "active"
                            ? "translate-x-6"
                            : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </div>

                  <div className="flex space-x-2 sm:space-x-3 flex-shrink-0">
                    <button
                      onClick={() => handleEditClick(subscription)}
                      className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-sm rounded-md bg-secondary text-foreground hover:bg-secondary/80 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(subscription.id)}
                      className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-sm rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite scroll loading indicator */}
          {hasMore && (
            <div
              ref={loadingRef}
              className="flex items-center justify-center py-8"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more subscriptions...</span>
                </div>
              ) : (
                <div className="text-muted-foreground">Scroll for more</div>
              )}
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && subscriptions.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                All subscriptions loaded ({subscriptions.length} total)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />

      {/* Toggle Status Confirmation Dialog */}
      {subscriptionToToggle && (
        <ConfirmDialog
          isOpen={showToggleConfirm}
          title={
            subscriptionToToggle.status === "active"
              ? "Deactivate Subscription"
              : "Activate Subscription"
          }
          message={
            subscriptionToToggle.status === "active"
              ? "Are you sure you want to deactivate this subscription? It will be moved to the Inactive tab."
              : "Are you sure you want to activate this subscription? It will be moved to the Active tab."
          }
          confirmLabel={
            subscriptionToToggle.status === "active" ? "Deactivate" : "Activate"
          }
          cancelLabel="Cancel"
          onConfirm={handleConfirmToggle}
          onCancel={() => {
            setShowToggleConfirm(false);
            setSubscriptionToToggle(null);
          }}
          variant={
            subscriptionToToggle.status === "active" ? "warning" : "info"
          }
        />
      )}

      {/* Edit Modal */}
      {subscriptionToEdit && (
        <SubscriptionEditModal
          subscription={subscriptionToEdit}
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          onSubscriptionUpdated={handleSubscriptionUpdated}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default SubscriptionList;
