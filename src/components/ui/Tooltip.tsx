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
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const showTooltip = () => {
    if (delay > 0) {
      const id = setTimeout(() => {
        setIsVisible(true);
      }, delay);
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

  // Update tooltip position whenever it becomes visible or on scroll/resize
  useEffect(() => {
    if (!isVisible || !isMounted) return;

    const updatePosition = () => {
      if (!childRef.current || !tooltipRef.current) return;

      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Calculate position based on the specified position prop
      switch (position) {
        case "bottom":
          top = childRect.bottom + window.scrollY + 8; // 8px gap
          left =
            childRect.left +
            window.scrollX +
            childRect.width / 2 -
            tooltipRect.width / 2;
          break;
        case "left":
          top =
            childRect.top +
            window.scrollY +
            childRect.height / 2 -
            tooltipRect.height / 2;
          left = childRect.left + window.scrollX - tooltipRect.width - 8; // 8px gap
          break;
        case "right":
          top =
            childRect.top +
            window.scrollY +
            childRect.height / 2 -
            tooltipRect.height / 2;
          left = childRect.right + window.scrollX + 8; // 8px gap
          break;
        case "top":
        default:
          top = childRect.top + window.scrollY - tooltipRect.height - 8; // 8px gap
          left =
            childRect.left +
            window.scrollX +
            childRect.width / 2 -
            tooltipRect.width / 2;
          break;
      }

      // Ensure tooltip stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if needed
      if (left < window.scrollX) {
        left = window.scrollX;
      } else if (left + tooltipRect.width > window.scrollX + viewportWidth) {
        left = window.scrollX + viewportWidth - tooltipRect.width;
      }

      // Adjust vertical position if needed
      if (top < window.scrollY) {
        top = window.scrollY;
      } else if (top + tooltipRect.height > window.scrollY + viewportHeight) {
        top = window.scrollY + viewportHeight - tooltipRect.height;
      }

      setTooltipStyle({
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      });
    };

    // Update position immediately and on resize/scroll
    updatePosition();

    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, { capture: true });

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, { capture: true });
    };
  }, [isVisible, isMounted, position]);

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
            className={`${width} p-2 rounded shadow-lg bg-popover text-popover-foreground text-xs pointer-events-none transition-opacity duration-150`}
            style={tooltipStyle}
          >
            {renderTooltipContent()}
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tooltip;
