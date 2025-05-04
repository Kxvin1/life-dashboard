"use client";

import { useDashboard } from "@/contexts/DashboardContext";
import CardGrid from "./DragDropWrapper";

const QuickAccess = () => {
  const { quickAccessCards, removeFromQuickAccess } = useDashboard();

  return (
    <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Quick Access</h2>
      </div>

      {quickAccessCards.length === 0 ? (
        <div className="bg-secondary/30 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            No quick access tools selected. Add tools from below.
          </p>
        </div>
      ) : (
        <CardGrid cards={quickAccessCards} onRemove={removeFromQuickAccess} />
      )}
    </div>
  );
};

export default QuickAccess;
