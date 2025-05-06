"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Category } from "@/types/finance";

interface CategorySelectProps {
  selectedCategoryId: number | null;
  onCategoryChange: (value: number | null) => void;
  transactionType?: string;
}

const CategorySelect = ({
  selectedCategoryId,
  onCategoryChange,
  transactionType,
}: CategorySelectProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookies.get("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
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

  return (
    <select
      value={selectedCategoryId || ""}
      onChange={(e) => {
        const value = e.target.value;
        onCategoryChange(value ? Number(value) : null);
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
