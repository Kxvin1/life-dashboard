import React from 'react';
import { formatTimeDuration, formatDaysDuration } from '@/lib/utils';

interface TimeEstimateFieldProps {
  isLongTerm: boolean;
  estimatedTimeMinutes: number | undefined;
  setEstimatedTimeMinutes: (minutes: number | undefined) => void;
  estimatedTimeDays: number | undefined;
  setEstimatedTimeDays: (days: number | undefined) => void;
  maxTimeMinutes: number;
  maxTimeDays: number;
}

const TimeEstimateField: React.FC<TimeEstimateFieldProps> = ({
  isLongTerm,
  estimatedTimeMinutes,
  setEstimatedTimeMinutes,
  estimatedTimeDays,
  setEstimatedTimeDays,
  maxTimeMinutes,
  maxTimeDays,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor="estimatedTime"
          className="block text-sm font-medium text-foreground"
        >
          {isLongTerm
            ? "Estimated Time (days)"
            : "Estimated Time (minutes)"}
        </label>
        {isLongTerm
          ? estimatedTimeDays && (
              <span className="text-xs text-muted-foreground">
                {formatDaysDuration(estimatedTimeDays)}
              </span>
            )
          : estimatedTimeMinutes && (
              <span className="text-xs text-muted-foreground">
                {formatTimeDuration(estimatedTimeMinutes)}
              </span>
            )}
      </div>
      {isLongTerm ? (
        <input
          type="number"
          id="estimatedTime"
          value={estimatedTimeDays || ""}
          onChange={(e) => {
            const value = e.target.value
              ? parseInt(e.target.value)
              : undefined;
            if (!value || (value > 0 && value <= maxTimeDays)) {
              setEstimatedTimeDays(value);
            }
          }}
          min="1"
          max={maxTimeDays}
          className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
          placeholder={`Max: ${maxTimeDays} days (1 year)`}
        />
      ) : (
        <input
          type="number"
          id="estimatedTime"
          value={estimatedTimeMinutes || ""}
          onChange={(e) => {
            const value = e.target.value
              ? parseInt(e.target.value)
              : undefined;
            if (!value || (value > 0 && value <= maxTimeMinutes)) {
              setEstimatedTimeMinutes(value);
            }
          }}
          min="1"
          max={maxTimeMinutes}
          className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
          placeholder={`Max: ${maxTimeMinutes} minutes (1 day)`}
        />
      )}
    </div>
  );
};

export default TimeEstimateField;
