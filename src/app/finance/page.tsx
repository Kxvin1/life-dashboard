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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Finance Dashboard</h1>
          <p className="mt-2 text-base text-gray-600 leading-relaxed">Track your income and expenses</p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Summary</h2>
          <TransactionSummary 
            key={`summary-${refreshKey}`}
            year={new Date().getFullYear()}
            month={null}
            categoryId={null}
          />
        </div>

        {/* Transaction Form */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Transaction</h2>
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>

        {/* Transaction List */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recent Transactions</h2>
          <TransactionList key={`list-${refreshKey}`} />
        </div>
      </div>
    </div>
  );
};

export default FinancePage; 