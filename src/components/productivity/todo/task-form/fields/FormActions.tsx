"use client";

import React from "react";

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  isEditing: boolean;
  isQuickAdd?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  onCancel,
  isEditing,
  isQuickAdd = false,
}) => {
  if (isQuickAdd) {
    return (
      <>
        <button
          type="submit"
          className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <span className="w-4 h-4 mr-2 border-2 rounded-full border-primary-foreground animate-spin border-t-transparent"></span>
          )}
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md bg-secondary text-foreground"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </>
    );
  }

  return (
    <div className="flex justify-end pt-2 space-x-2 sticky bottom-0 bg-card pb-1 z-10">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-md bg-secondary text-foreground"
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <span className="w-4 h-4 mr-2 border-2 rounded-full border-primary-foreground animate-spin border-t-transparent"></span>
        )}
        {isEditing ? "Update" : "Create"}
      </button>
    </div>
  );
};

export default FormActions;
