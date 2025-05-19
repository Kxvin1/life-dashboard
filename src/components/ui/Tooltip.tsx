"use client";

import React, { useState, ReactNode, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const showTooltip = () => {
    if (delay > 0) {
      const id = setTimeout(() => {
        setIsVisible(true);
        updatePosition();
      }, delay);
      setTimeoutId(id);
    } else {
      setIsVisible(true);
      updatePosition();
    }
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (position) {
      case "bottom":
        top = childRect.bottom + scrollY + 8; // 8px gap
        left =
          childRect.left +
          scrollX +
          childRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case "left":
        top =
          childRect.top +
          scrollY +
          childRect.height / 2 -
          tooltipRect.height / 2;
        left = childRect.left + scrollX - tooltipRect.width - 8; // 8px gap
        break;
      case "right":
        top =
          childRect.top +
          scrollY +
          childRect.height / 2 -
          tooltipRect.height / 2;
        left = childRect.right + scrollX + 8; // 8px gap
        break;
      case "top":
      default:
        top = childRect.top + scrollY - tooltipRect.height - 8; // 8px gap
        left =
          childRect.left +
          scrollX +
          childRect.width / 2 -
          tooltipRect.width / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if needed
    if (left < 0) {
      left = 0;
    } else if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width;
    }

    // Adjust vertical position if needed
    if (top < 0) {
      top = 0;
    } else if (top + tooltipRect.height > viewportHeight + scrollY) {
      top = viewportHeight + scrollY - tooltipRect.height;
    }

    setTooltipPosition({ top, left });
  };

  // Update position when window is resized
  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isVisible]);

  const renderTooltipContent = () => {
    if (typeof content === "string") {
      return (
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
      );
    }
    return content;
  };

  return (
    <div
      ref={childRef}
      className="inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isMounted &&
        isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed ${width} p-2 rounded shadow-lg bg-popover text-popover-foreground text-xs pointer-events-none transition-opacity duration-150 z-[9999] ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            {renderTooltipContent()}
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tooltip;
