"use client";

import { useState } from "react";
import { SubscriptionStatus } from "@/types/finance";
import SubscriptionList from "./SubscriptionList";

interface SubscriptionTabsProps {
  onSubscriptionDeleted: () => void;
}

type SortField = "name" | "price" | "upcoming";
type SortDirection = "asc" | "desc";

const SubscriptionTabs = ({ onSubscriptionDeleted }: SubscriptionTabsProps) => {
  const [activeTab, setActiveTab] = useState<SubscriptionStatus>("active");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              activeTab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              activeTab === "inactive"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("inactive")}
          >
            Inactive
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-2 py-1 text-sm border rounded-md border-input bg-background"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            {activeTab === "active" && (
              <option value="upcoming">Upcoming Payments</option>
            )}
          </select>
          <button
            onClick={() =>
              setSortDirection(sortDirection === "asc" ? "desc" : "asc")
            }
            className="p-1 rounded-md hover:bg-accent"
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
                <path d="M21 12h-8" />
                <path d="M21 16h-8" />
                <path d="M21 8h-8" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="m3 16 4 4 4-4" />
                <path d="M7 20V4" />
                <path d="M21 12h-8" />
                <path d="M21 16h-8" />
                <path d="M21 8h-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <SubscriptionList
        status={activeTab}
        onSubscriptionDeleted={onSubscriptionDeleted}
        sortField={sortField}
        sortDirection={sortDirection}
      />
    </div>
  );
};

export default SubscriptionTabs;
