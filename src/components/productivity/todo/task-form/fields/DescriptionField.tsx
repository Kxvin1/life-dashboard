"use client";

import React from "react";

interface DescriptionFieldProps {
  description: string;
  setDescription: (description: string) => void;
  maxLength: number;
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({
  description,
  setDescription,
  maxLength,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <span className="text-xs text-muted-foreground">
          {description.length}/{maxLength} characters
        </span>
      </div>
      <textarea
        id="description"
        value={description}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            setDescription(e.target.value);
          }
        }}
        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground min-h-[100px] resize-y"
        maxLength={maxLength}
      />
    </div>
  );
};

export default DescriptionField;
