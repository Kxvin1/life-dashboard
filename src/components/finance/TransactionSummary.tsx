'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface TransactionSummary {
  total_income: number;
  total_expenses: number;
  net_income: number;
  transaction_count: number;
}

const TransactionSummaryComponent = () => {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading summary...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm font-medium text-gray-500">Total Income</div>
        <div className="mt-2 text-3xl font-semibold text-green-600">
          {formatAmount(summary.total_income)}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm font-medium text-gray-500">Total Expenses</div>
        <div className="mt-2 text-3xl font-semibold text-red-600">
          {formatAmount(summary.total_expenses)}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm font-medium text-gray-500">Net Income</div>
        <div className={`mt-2 text-3xl font-semibold ${
          summary.net_income >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatAmount(summary.net_income)}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm font-medium text-gray-500">Total Transactions</div>
        <div className="mt-2 text-3xl font-semibold text-blue-600">
          {summary.transaction_count}
        </div>
      </div>
    </div>
  );
};

export default TransactionSummaryComponent; 