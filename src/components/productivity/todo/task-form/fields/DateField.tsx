"use client";

import React from "react";

interface DateFieldProps {
  dueDate: string;
  setDueDate: (dueDate: string) => void;
}

const DateField: React.FC<DateFieldProps> = ({ dueDate, setDueDate }) => {
  return (
    <div>
      <label
        htmlFor="dueDate"
        className="block mb-1 text-sm font-medium text-foreground"
      >
        Due Date
      </label>
      <input
        type="date"
        id="dueDate"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
      />
    </div>
  );
};

export default DateField;
