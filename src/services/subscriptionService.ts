import Cookies from "js-cookie";
import { Subscription, SubscriptionSummary } from "@/types/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const fetchSubscriptions = async (
  status?: string
): Promise<Subscription[]> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    let url = `${API_URL}/api/v1/subscriptions/`;
    if (status) {
      url += `?status=${status}&_=${timestamp}`;
    } else {
      url += `?_=${timestamp}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Use cache: 'no-store' which is safer for CORS
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch subscriptions");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchSubscriptionSummary =
  async (): Promise<SubscriptionSummary> => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const url = `${API_URL}/api/v1/subscriptions-summary/?_=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription summary");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

export const createSubscription = async (
  subscription: Omit<Subscription, "id">
): Promise<Subscription> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();
    const response = await fetch(
      `${API_URL}/api/v1/subscriptions/?_=${timestamp}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create subscription");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateSubscription = async (
  id: string,
  subscription: Partial<Subscription>
): Promise<Subscription> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/subscriptions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("Failed to update subscription");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const toggleSubscriptionStatus = async (
  id: string,
  currentStatus: "active" | "inactive"
): Promise<Subscription> => {
  try {
    // Toggle the status
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    // If setting to inactive, include the last_active_date
    const updateData: Partial<Subscription> = {
      status: newStatus,
    };

    if (newStatus === "inactive") {
      updateData.last_active_date = new Date().toISOString().split("T")[0];
    }

    // Use the existing updateSubscription function
    return await updateSubscription(id, updateData);
  } catch (error) {
    throw error;
  }
};

export const deleteSubscription = async (id: string): Promise<boolean> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/subscriptions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete subscription");
    }

    return true;
  } catch (error) {
    throw error;
  }
};
