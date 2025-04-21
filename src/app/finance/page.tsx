'use client';

import { useState } from 'react';
import TransactionForm from '@/components/finance/TransactionForm';
import TransactionList from '@/components/finance/TransactionList';
import TransactionSummary from '@/components/finance/TransactionSummary';

const FinancePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your income and expenses</p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <TransactionSummary 
            key={`summary-${refreshKey}`}
            year={new Date().getFullYear()}
            month={null}
            categoryId={null}
          />
        </div>

        {/* Transaction Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Transaction</h2>
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <TransactionList key={`list-${refreshKey}`} />
        </div>
      </div>
    </div>
  );
};

export default FinancePage; 