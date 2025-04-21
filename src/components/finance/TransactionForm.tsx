'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import CategorySelect from './CategorySelect';

interface TransactionFormProps {
  onTransactionAdded: () => void;
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';

const TransactionForm = ({ onTransactionAdded }: TransactionFormProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = Cookies.get('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount.toString()),
          description,
          type,
          payment_method: paymentMethod,
          date,
          category_id: categoryId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      setAmount(0);
      setDescription('');
      setCategoryId(null);
      onTransactionAdded();
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white hover:bg-gray-50 cursor-pointer appearance-none pl-3 pr-10 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white hover:bg-gray-50 cursor-pointer appearance-none pl-3 pr-10 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
        <select
          id="type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as TransactionType);
            setCategoryId(null); // Reset category when type changes
          }}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white hover:bg-gray-50 cursor-pointer appearance-none pl-3 pr-10 py-2"
        >
          <option value="income" className="text-green-600">Income</option>
          <option value="expense" className="text-red-600">Expense</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <CategorySelect
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white hover:bg-gray-50 cursor-pointer appearance-none pl-3 pr-10 py-2"
        >
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white hover:bg-gray-50 cursor-pointer appearance-none pl-3 pr-10 py-2"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  );
};

export default TransactionForm; 