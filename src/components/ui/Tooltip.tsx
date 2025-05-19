"use client";

import React, { useState, ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  width?: string;
  delay?: number;
}

const Tooltip = ({
  children,
  content,
  position = "top",
  width = "w-64",
  delay = 0,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (delay > 0) {
      const id = setTimeout(() => setIsVisible(true), delay);
      setTimeoutId(id);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      case "top":
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 ${width} p-2 rounded shadow-lg bg-popover text-popover-foreground text-xs pointer-events-none transition-opacity ${
            isVisible ? "opacity-100" : "opacity-0"
          } ${getPositionClasses()}`}
        >
          {typeof content === "string" ? (
            <div>
              {content.includes(":") ? (
                <>
                  <div className="font-medium mb-1">
                    {content.split(":")[0].trim()}
                  </div>
                  <p>{content.split(":").slice(1).join(":").trim()}</p>
                </>
              ) : (
                <p>{content}</p>
              )}
            </div>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
