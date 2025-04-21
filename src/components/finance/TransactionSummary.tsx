'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { formatCurrency } from '@/lib/utils';
import { MonthlySummary } from '@/types/finance';

interface TransactionSummaryProps {
  year: number;
  month: number | null;
  categoryId: number | null;
}

export default function TransactionSummary({ year, month, categoryId }: TransactionSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<Record<number, MonthlySummary>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get('token');
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/summaries/monthly?year=${year}${month ? `&month=${month}` : ''}${categoryId ? `&category_id=${categoryId}` : ''}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch summary');
        const data = await response.json();
        setMonthlyData(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, categoryId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthData = monthlyData[currentMonth] || { income: 0, expense: 0, net: 0 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Income</h3>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(currentMonthData.income)}</p>
      </div>
      
      <div className="bg-red-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Expenses</h3>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(currentMonthData.expense)}</p>
      </div>
      
      <div className={`rounded-lg p-4 ${currentMonthData.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Net</h3>
        <p className={`text-2xl font-bold ${currentMonthData.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(currentMonthData.net)}
        </p>
      </div>
    </div>
  );
} 