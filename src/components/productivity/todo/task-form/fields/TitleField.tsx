import React from 'react';

interface TitleFieldProps {
  title: string;
  setTitle: (title: string) => void;
  maxLength: number;
  isQuickAdd?: boolean;
  isLongTerm?: boolean;
}

const TitleField: React.FC<TitleFieldProps> = ({
  title,
  setTitle,
  maxLength,
  isQuickAdd = false,
  isLongTerm = false,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={isQuickAdd ? "quickTitle" : "title"}
          className="block text-sm font-medium text-foreground"
        >
          {isQuickAdd ? `${isLongTerm ? "Goal" : "Task"} Title` : "Title *"}
        </label>
        <span className="text-xs text-muted-foreground">
          {title.length}/{maxLength} characters
        </span>
      </div>
      <input
        type="text"
        id={isQuickAdd ? "quickTitle" : "title"}
        value={title}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            setTitle(e.target.value);
          }
        }}
        className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
        maxLength={maxLength}
        required
        placeholder={isQuickAdd ? `Enter ${isLongTerm ? "long-term task" : "task"} title` : undefined}
      />
    </div>
  );
};

export default TitleField;
