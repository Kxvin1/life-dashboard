'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { formatCurrency } from '@/lib/utils';

interface OverviewSummaryProps {
  year: number;
  month: number | null;
  categoryId: number | null;
  viewMode: 'monthly' | 'yearly';
}

interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}

interface YearlySummary {
  total_income: number;
  total_expense: number;
  net_income: number;
}

interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category: {
    id: number;
    name: string;
    type: 'income' | 'expense';
  } | null;
}

export default function OverviewSummary({ year, month, categoryId, viewMode }: OverviewSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<Record<number, MonthlySummary>>({});
  const [yearlyData, setYearlyData] = useState<YearlySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get('token');
        
        if (viewMode === 'monthly') {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/summaries/monthly?year=${year}${month ? `&month=${month}` : ''}${categoryId ? `&category_id=${categoryId}` : ''}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (!response.ok) throw new Error('Failed to fetch monthly summary');
          const data = await response.json();
          setMonthlyData(data.summary);
        } else {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/summaries/yearly?year=${year}${categoryId ? `&category_id=${categoryId}` : ''}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (!response.ok) throw new Error('Failed to fetch yearly summary');
          const data = await response.json();
          setYearlyData(data);
        }

        const transactionsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions?year=${year}${month ? `&month=${month}` : ''}${categoryId ? `&category_id=${categoryId}` : ''}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, categoryId, viewMode]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const renderSummary = () => {
    if (viewMode === 'monthly') {
      if (month) {
        const monthData = monthlyData[month] || { income: 0, expense: 0, net: 0 };
        return (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Income</h3>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(monthData.income)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Expenses</h3>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(monthData.expense)}</p>
              </div>
              <div className={`rounded-lg p-6 border ${monthData.net >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Net</h3>
                <p className={`text-3xl font-bold ${monthData.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthData.net)}
                </p>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{year} Monthly Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(monthlyData).map(([monthNum, data]) => (
                <div key={monthNum} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {new Date(year, Number(monthNum) - 1).toLocaleString('default', { month: 'long' })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Income</span>
                      <span className="text-green-600 font-medium">{formatCurrency(data.income)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Expenses</span>
                      <span className="text-red-600 font-medium">{formatCurrency(data.expense)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Net</span>
                      <span className={`font-medium ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.net)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{year} Yearly Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-6 border border-green-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Income</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(yearlyData?.total_income || 0)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-6 border border-red-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(yearlyData?.total_expense || 0)}</p>
            </div>
            <div className={`rounded-lg p-6 border ${(yearlyData?.net_income || 0) >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Net Income</h3>
              <p className={`text-3xl font-bold ${(yearlyData?.net_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(yearlyData?.net_income || 0)}
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderTransactions = () => {
    if (transactions.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-500 text-center">No transactions found</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSummary()}
      {renderTransactions()}
    </div>
  );
} 