"use client";

import React from "react";

interface TaskCategory {
  id: number;
  name: string;
}

interface CategoryFieldProps {
  categoryId: number | undefined;
  setCategoryId: (categoryId: number | undefined) => void;
  taskCategories: TaskCategory[];
}

const CategoryField: React.FC<CategoryFieldProps> = ({
  categoryId,
  setCategoryId,
  taskCategories,
}) => {
  return (
    <div>
      <label
        htmlFor="category"
        className="block mb-1 text-sm font-medium text-foreground"
      >
        Category
      </label>
      <select
        id="category"
        value={categoryId || ""}
        onChange={(e) =>
          setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)
        }
        className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
      >
        <option value="">Not Categorized</option>
        {taskCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryField;
