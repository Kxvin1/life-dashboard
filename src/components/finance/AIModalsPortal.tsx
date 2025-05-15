"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import AIInsightsModal from "./AIInsightsModal";
import AIInsightsHistoryModal from "./AIInsightsHistoryModal";
import { AIInsightResponse } from "@/services/aiInsightService";

interface AIModalsPortalProps {
  insightsModalOpen: boolean;
  historyModalOpen: boolean;
  insightData: AIInsightResponse | null;
  selectedTimePeriod: string;
  onInsightsClose: () => void;
  onHistoryClose: () => void;
}

export default function AIModalsPortal({
  insightsModalOpen,
  historyModalOpen,
  insightData,
  selectedTimePeriod,
  onInsightsClose,
  onHistoryClose,
}: AIModalsPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {typeof window === "object" &&
        insightsModalOpen &&
        insightData &&
        createPortal(
          <AIInsightsModal
            isOpen={insightsModalOpen}
            onClose={onInsightsClose}
            data={insightData}
            selectedTimePeriod={selectedTimePeriod}
          />,
          document.body
        )}

      {typeof window === "object" &&
        historyModalOpen &&
        createPortal(
          <AIInsightsHistoryModal
            isOpen={historyModalOpen}
            onClose={onHistoryClose}
          />,
          document.body
        )}
    </>
  );
}
