"use client";

import { DashboardCard as DashboardCardType } from "@/contexts/DashboardContext";
import DashboardCard from "./DashboardCard";

interface CardGridProps {
  cards: DashboardCardType[];
  onRemove: (id: string) => void;
}

const CardGrid = ({ cards, onRemove }: CardGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map((card) => (
        <DashboardCard key={card.id} card={card} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default CardGrid;
