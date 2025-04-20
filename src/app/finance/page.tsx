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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Finance Tracker</h1>
          
          {/* Transaction Summary */}
          <div className="mb-8">
            <TransactionSummary key={`summary-${refreshKey}`} />
          </div>

          {/* Transaction Form */}
          <div className="mb-8">
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
          </div>

          {/* Transaction List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            <TransactionList key={`list-${refreshKey}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage; 