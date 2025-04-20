import { Category } from '@/types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', type: 'income', color: '#22c55e' },
  { id: 'freelance', name: 'Freelance', type: 'income', color: '#3b82f6' },
  { id: 'investments', name: 'Investments', type: 'income', color: '#8b5cf6' },
  { id: 'housing', name: 'Housing', type: 'expense', color: '#ef4444' },
  { id: 'food', name: 'Food', type: 'expense', color: '#f59e0b' },
  { id: 'transportation', name: 'Transportation', type: 'expense', color: '#10b981' },
  { id: 'utilities', name: 'Utilities', type: 'expense', color: '#6366f1' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', color: '#ec4899' },
];

export const DATE_FORMAT = 'YYYY-MM-DD';
export const CURRENCY = 'USD'; 