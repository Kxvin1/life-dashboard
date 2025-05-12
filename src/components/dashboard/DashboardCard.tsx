"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { DashboardCard as DashboardCardType } from "@/contexts/DashboardContext";

interface DashboardCardProps {
  card: DashboardCardType;
  index?: number; // Make index optional since we're not using it
  onRemove?: (id: string) => void;
  onAdd?: (id: string) => void;
}

const DashboardCard = ({ card, onRemove, onAdd }: DashboardCardProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Helper function to handle card navigation
  const handleCardNavigation = (e: React.MouseEvent) => {
    // Check if the click target is a button or inside a button
    const target = e.target as HTMLElement;
    if (target.closest("button")) {
      // If clicked on a button, prevent navigation
      e.preventDefault();
    }
  };

  const CardContent = () => (
    <div className="relative group">
      {/* Card content */}
      <div
        className={`p-4 rounded-lg ${
          card.isImplemented
            ? "bg-secondary/50 hover:bg-secondary cursor-pointer"
            : "bg-secondary/30 cursor-not-allowed"
        } transition-colors duration-200 h-full`}
      >
        <h3 className="text-lg font-medium text-foreground">{card.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>

        {/* Category badge */}
        <div className="absolute z-20 top-1 right-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              card.category === "finance"
                ? "bg-green-200 text-green-800"
                : card.category === "productivity"
                ? "bg-blue-200 text-blue-800"
                : card.category === "health"
                ? "bg-purple-200 text-purple-800"
                : "bg-orange-200 text-orange-800"
            }`}
          >
            {card.category.charAt(0).toUpperCase() + card.category.slice(1)}
          </span>
        </div>

        {/* Action buttons - visible on mobile, hover on desktop */}
        {(onRemove || onAdd) && (
          <div
            className={`absolute bottom-2 right-2 z-30 ${
              isMobile
                ? "opacity-100" // Always visible on mobile
                : "opacity-0 group-hover:opacity-100 transition-opacity duration-200" // Hover effect on desktop
            }`}
          >
            {onRemove && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(card.id);
                }}
                className="p-2 rounded-full bg-secondary text-foreground hover:bg-secondary/80 shadow-md"
                aria-label="Remove from Quick Access"
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            {onAdd && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAdd(card.id);
                }}
                className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 shadow-md"
                aria-label="Add to Quick Access"
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Not implemented indicator */}
        {!card.isImplemented && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50">
            <span className="px-2 py-1 text-xs rounded bg-secondary text-foreground">
              Coming Soon
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return card.isImplemented ? (
    <Link href={card.href} onClick={handleCardNavigation}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
};

export default DashboardCard;
