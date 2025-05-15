"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import PomodoroAIModal from "./PomodoroAIModal";
import PomodoroAIHistoryModal from "./PomodoroAIHistoryModal";

interface PomodoroModalsPortalProps {
  insightsModalOpen: boolean;
  historyModalOpen: boolean;
  insightData: any | null;
  onInsightsClose: () => void;
  onHistoryClose: () => void;
}

export default function PomodoroModalsPortal({
  insightsModalOpen,
  historyModalOpen,
  insightData,
  onInsightsClose,
  onHistoryClose,
}: PomodoroModalsPortalProps) {
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
          <PomodoroAIModal
            isOpen={insightsModalOpen}
            onClose={onInsightsClose}
            data={insightData}
          />,
          document.body
        )}

      {typeof window === "object" &&
        historyModalOpen &&
        createPortal(
          <PomodoroAIHistoryModal
            isOpen={historyModalOpen}
            onClose={onHistoryClose}
          />,
          document.body
        )}
    </>
  );
}
