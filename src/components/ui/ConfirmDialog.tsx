"use client";

import React, { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "warning" | "danger" | "info";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "warning",
}) => {
  // If not open, don't render anything
  if (!isOpen) return null;

  // Reference to the modal content for focus management
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button when the modal opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onCancel]);

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
          confirmButton:
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        };
      case "info":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          confirmButton:
            "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        };
      case "warning":
      default:
        return {
          icon: (
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
          confirmButton:
            "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop with click handler to close */}
        <div
          className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* Modal container - centered in viewport */}
        <div className="relative w-full max-w-lg px-4 pt-5 pb-4 mx-auto overflow-hidden text-left bg-card rounded-lg shadow-xl sm:p-6">
          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-full sm:mx-0 sm:h-10 sm:w-10">
              {variantStyles.icon}
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-foreground">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              ref={confirmButtonRef}
              className={`inline-flex justify-center w-full px-4 py-2 text-base font-medium border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${variantStyles.confirmButton}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium border rounded-md shadow-sm text-foreground bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
