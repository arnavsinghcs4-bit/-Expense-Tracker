export type Category =
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Other',
];

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'BRL' | 'MXN' | 'KRW';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
];

export const DEFAULT_CURRENCY: Currency = 'USD';

export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
}

export function formatCurrency(amount: number, currency: Currency): string {
  const info = getCurrencyInfo(currency);
  return `${info.symbol}${amount.toFixed(2)}`;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 weeks = weekly + interval: 2
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  occurrences?: number; // optional limit
}

export interface RecurringExpense {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  description: string;
  pattern: RecurrencePattern;
  nextDueDate: string; // ISO date string
  lastGeneratedDate?: string; // ISO date string
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  description: string;
  date: string; // ISO string
  createdAt: string;
  recurringExpenseId?: string; // links to recurring expense if generated from one
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  amount: number;
  currency: Currency;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining': '#ef4444',
  'Transportation': '#f97316',
  'Shopping': '#eab308',
  'Entertainment': '#22c55e',
  'Bills & Utilities': '#06b6d4',
  'Healthcare': '#8b5cf6',
  'Travel': '#ec4899',
  'Education': '#6366f1',
  'Other': '#6b7280',
};

export const RECURRENCE_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export type Theme = 'light' | 'dark' | 'system';