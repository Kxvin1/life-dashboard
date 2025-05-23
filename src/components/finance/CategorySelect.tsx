"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { fetchCategories } from "@/services/categoryService";
import { Category } from "@/types/finance";

interface CategorySelectProps {
  // Support both naming conventions
  selectedCategoryId?: number | null;
  value?: number | null;
  onCategoryChange?: (value: number | null) => void;
  onChange?: (value: number | null) => void;
  transactionType?: string;
}

const CategorySelect = ({
  selectedCategoryId,
  value,
  onCategoryChange,
  onChange,
  transactionType,
}: CategorySelectProps) => {
  // Normalize props to handle both usage patterns
  const effectiveValue =
    selectedCategoryId !== undefined ? selectedCategoryId : value;
  const effectiveOnChange = onCategoryChange || onChange;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load categories"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (isLoading) {
    return (
      <select
        disabled
        className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground"
      >
        <option>Loading categories...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select
        disabled
        className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground"
      >
        <option>Error loading categories</option>
      </select>
    );
  }

  const incomeCategories = categories.filter((cat) => cat.type === "income");
  const expenseCategories = categories.filter((cat) => cat.type === "expense");

  // Filter categories based on transaction type if provided
  let filteredCategories = categories;
  if (transactionType) {
    filteredCategories = categories.filter(
      (cat) => cat.type === transactionType
    );
  }

  // Check if we have a valid onChange handler
  if (!effectiveOnChange) {
    return (
      <select
        disabled
        className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground"
      >
        <option>Error: No onChange handler</option>
      </select>
    );
  }

  return (
    <select
      value={effectiveValue || ""}
      onChange={(e) => {
        const value = e.target.value;

        effectiveOnChange(value ? Number(value) : null);
      }}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="">Select a Category</option>

      {transactionType ? (
        // If transaction type is provided, show only relevant categories
        filteredCategories.map((category) => (
          <option
            key={category.id}
            value={category.id}
            className={
              category.type === "income" ? "text-green-600" : "text-red-600"
            }
          >
            {category.name}
          </option>
        ))
      ) : (
        // Otherwise show all categories grouped by type
        <>
          <optgroup label="Income">
            {incomeCategories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                className="text-green-600"
              >
                {category.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Expenses">
            {expenseCategories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                className="text-red-600"
              >
                {category.name}
              </option>
            ))}
          </optgroup>
        </>
      )}
    </select>
  );
};

export default CategorySelect;
