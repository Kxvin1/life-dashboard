"use client";

import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import DashboardCard from "./DashboardCard";
import { CardCategory } from "@/contexts/DashboardContext";

const AllTools = () => {
  const { allCards, quickAccessCards, addToQuickAccess } = useDashboard();
  const [activeCategory, setActiveCategory] = useState<CardCategory | "all">(
    "all"
  );

  const categories: { id: CardCategory | "all"; label: string }[] = [
    { id: "all", label: "All Tools" },
    { id: "finance", label: "Finance" },
    { id: "productivity", label: "Productivity" },
    { id: "health", label: "Health" },
    { id: "personal", label: "Personal" },
  ];

  const filteredCards =
    activeCategory === "all"
      ? allCards
      : allCards.filter((card) => card.category === activeCategory);

  return (
    <div className="bg-card rounded-xl shadow-md border border-border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">All Tools</h2>
        <div className="text-xs text-muted-foreground">
          Tap the + button to add to Quick Access
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeCategory === category.id
                ? "bg-primary text-white"
                : "bg-secondary/50 text-foreground hover:bg-secondary"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredCards.map((card) => (
          <DashboardCard
            key={card.id}
            card={card}
            onAdd={
              quickAccessCards.some((qc) => qc.id === card.id)
                ? undefined
                : addToQuickAccess
            }
          />
        ))}
      </div>
    </div>
  );
};

export default AllTools;
