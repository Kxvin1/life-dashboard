"use client";

import React from "react";
import { RecurringFrequency } from "@/services/taskService";

interface RecurringTaskFieldProps {
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  recurringFrequency: RecurringFrequency | undefined;
  setRecurringFrequency: (frequency: RecurringFrequency | undefined) => void;
}

const RecurringTaskField: React.FC<RecurringTaskFieldProps> = ({
  isRecurring,
  setIsRecurring,
  recurringFrequency,
  setRecurringFrequency,
}) => {
  return (
    <div>
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="w-4 h-4 mr-2 border-gray-300 rounded text-primary focus:ring-primary"
        />
        <label
          htmlFor="isRecurring"
          className="text-sm font-medium text-foreground"
          title="Mark a task as recurring to indicate it should be repeated regularly. Note: Currently, you'll need to manually create new instances of recurring tasks after completion."
        >
          Recurring Task
          <span className="ml-1 text-xs text-muted-foreground">(Manual)</span>
        </label>
      </div>

      {isRecurring && (
        <select
          id="recurringFrequency"
          value={recurringFrequency || ""}
          onChange={(e) =>
            setRecurringFrequency(
              e.target.value
                ? (e.target.value as RecurringFrequency)
                : undefined
            )
          }
          className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
        >
          <option value="">Select Frequency</option>
          <option value={RecurringFrequency.DAILY}>Daily</option>
          <option value={RecurringFrequency.WEEKLY}>Weekly</option>
          <option value={RecurringFrequency.MONTHLY}>Monthly</option>
          <option value={RecurringFrequency.CUSTOM}>Custom</option>
        </select>
      )}
    </div>
  );
};

export default RecurringTaskField;
