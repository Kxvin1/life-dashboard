export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: Category | null;
  date: string;
  type: 'income' | 'expense';
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';
  notes: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}

export interface YearlySummary {
  total_income: number;
  total_expense: number;
  net_income: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlySummary: {
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }[];
} 