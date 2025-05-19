"use client";

import React from "react";
import { TaskPriority } from "@/services/taskService";

interface PriorityFieldProps {
  priority: TaskPriority;
  setPriority: (priority: TaskPriority) => void;
}

const PriorityField: React.FC<PriorityFieldProps> = ({
  priority,
  setPriority,
}) => {
  return (
    <div>
      <label
        htmlFor="priority"
        className="block mb-1 text-sm font-medium text-foreground"
      >
        Priority
      </label>
      <select
        id="priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
        className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
      >
        <option value={TaskPriority.LOW}>Low</option>
        <option value={TaskPriority.MEDIUM}>Medium</option>
        <option value={TaskPriority.HIGH}>High</option>
      </select>
    </div>
  );
};

export default PriorityField;
