"use client";

import React from "react";
import { TitleField, FormActions } from "./fields";

interface QuickAddTaskFormProps {
  isLongTerm: boolean;
  title: string;
  setTitle: (title: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  maxTitleLength: number;
}

const QuickAddTaskForm: React.FC<QuickAddTaskFormProps> = ({
  isLongTerm,
  title,
  setTitle,
  isSubmitting,
  onSubmit,
  onCancel,
  maxTitleLength,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex flex-col space-y-2">
      <TitleField
        title={title}
        setTitle={setTitle}
        maxLength={maxTitleLength}
        isQuickAdd={true}
        isLongTerm={isLongTerm}
      />
      <div className="flex space-x-2 sticky bottom-0 bg-card pt-2 pb-1 z-10">
        <FormActions
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          isEditing={false}
          isQuickAdd={true}
        />
      </div>
    </form>
  );
};

export default QuickAddTaskForm;
