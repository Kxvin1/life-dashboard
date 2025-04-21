'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Category } from '@/types/finance';

interface CategorySelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const CategorySelect = ({ value, onChange }: CategorySelectProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookies.get('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
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
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-gray-100 appearance-none pl-3 pr-10 py-2"
      >
        <option>Loading categories...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select
        disabled
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-gray-100 appearance-none pl-3 pr-10 py-2"
      >
        <option>Error loading categories</option>
      </select>
    );
  }

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white hover:bg-gray-50 cursor-pointer appearance-none pl-3 pr-10 py-2"
    >
      <option value="">All Categories</option>
      <optgroup label="Income">
        {incomeCategories.map((category) => (
          <option key={category.id} value={category.id} className="text-green-600">
            {category.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Expenses">
        {expenseCategories.map((category) => (
          <option key={category.id} value={category.id} className="text-red-600">
            {category.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
};

export default CategorySelect; 