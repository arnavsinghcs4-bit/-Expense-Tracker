import { Expense, MonthlyBudget, CATEGORIES, Category, RecurringExpense, RecurrencePattern, Currency, DEFAULT_CURRENCY } from './types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, parseISO, format } from 'date-fns';

const EXPENSES_KEY = 'expense-tracker-expenses';
const BUDGETS_KEY = 'expense-tracker-budgets';
const RECURRING_EXPENSES_KEY = 'expense-tracker-recurring-expenses';
const THEME_KEY = 'expense-tracker-theme';
const CURRENCY_KEY = 'expense-tracker-currency';

export type Theme = 'light' | 'dark' | 'system';

export function getTheme(): Theme {
  try {
    const data = localStorage.getItem(THEME_KEY);
    return (data as Theme) || 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const theme = getTheme();
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function getCurrency(): Currency {
  try {
    const data = localStorage.getItem(CURRENCY_KEY);
    return (data as Currency) || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function setCurrency(currency: Currency): void {
  localStorage.setItem(CURRENCY_KEY, currency);
}

export function getExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) return null;

  expenses[index] = { ...expenses[index], ...updates };
  saveExpenses(expenses);
  return expenses[index];
}

export function deleteExpense(id: string): boolean {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  if (filtered.length === expenses.length) return false;
  saveExpenses(filtered);
  return true;
}

export function getBudgets(): MonthlyBudget[] {
  try {
    const data = localStorage.getItem(BUDGETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: MonthlyBudget[]): void {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

export function setBudget(month: string, amount: number, currency: Currency = getCurrency()): MonthlyBudget {
  const budgets = getBudgets();
  const existing = budgets.findIndex(b => b.month === month);
  const budget: MonthlyBudget = { month, amount, currency };

  if (existing >= 0) {
    budgets[existing] = budget;
  } else {
    budgets.push(budget);
  }
  saveBudgets(budgets);
  return budget;
}

export function getBudget(month: string): MonthlyBudget | undefined {
  return getBudgets().find(b => b.month === month);
}

export function getExpensesByMonth(month: string): Expense[] {
  return getExpenses().filter(e => e.date.startsWith(month));
}

export function getTotalByCategory(month: string): Record<Category, number> {
  const expenses = getExpensesByMonth(month);
  const totals: Record<Category, number> = {} as Record<Category, number>;

  CATEGORIES.forEach(cat => totals[cat] = 0);

  expenses.forEach(e => {
    totals[e.category] += e.amount;
  });

  return totals;
}

export function getMonthlyTotal(month: string): number {
  return getExpensesByMonth(month).reduce((sum, e) => sum + e.amount, 0);
}

export function getRecentExpenses(limit = 10): Expense[] {
  return getExpenses()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// ===== Recurring Expenses =====

function calculateNextDueDate(pattern: RecurrencePattern, fromDate: Date): Date {
  const { frequency, interval } = pattern;
  switch (frequency) {
    case 'daily':
      return addDays(fromDate, interval);
    case 'weekly':
      return addWeeks(fromDate, interval);
    case 'monthly':
      return addMonths(fromDate, interval);
    case 'yearly':
      return addYears(fromDate, interval);
  }
}

function isWithinPattern(pattern: RecurrencePattern, date: Date): boolean {
  const startDate = parseISO(pattern.startDate);
  if (isBefore(date, startDate)) return false;

  if (pattern.endDate) {
    const endDate = parseISO(pattern.endDate);
    if (isAfter(date, endDate)) return false;
  }

  if (pattern.occurrences && pattern.occurrences > 0) {
    // This is a simplified check - in reality you'd count occurrences
    // For now we'll rely on endDate or manual deactivation
  }

  return true;
}

export function getRecurringExpenses(): RecurringExpense[] {
  try {
    const data = localStorage.getItem(RECURRING_EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecurringExpenses(expenses: RecurringExpense[]): void {
  localStorage.setItem(RECURRING_EXPENSES_KEY, JSON.stringify(expenses));
}

export function addRecurringExpense(
  expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'nextDueDate' | 'lastGeneratedDate'>
): RecurringExpense {
  const expenses = getRecurringExpenses();
  const newExpense: RecurringExpense = {
    ...expense,
    id: uuidv4(),
    nextDueDate: expense.pattern.startDate,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  expenses.push(newExpense);
  saveRecurringExpenses(expenses);
  return newExpense;
}

export function updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): RecurringExpense | null {
  const expenses = getRecurringExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) return null;

  // If pattern or startDate changed, recalculate nextDueDate
  const updated = { ...expenses[index], ...updates };
  if (updates.pattern || updates.isActive === true) {
    const pattern = updated.pattern;
    const fromDate = updates.pattern?.startDate
      ? parseISO(updates.pattern.startDate)
      : (expenses[index].lastGeneratedDate ? parseISO(expenses[index].lastGeneratedDate!) : parseISO(pattern.startDate));
    updated.nextDueDate = format(calculateNextDueDate(pattern, fromDate), 'yyyy-MM-dd');
  }

  expenses[index] = updated;
  saveRecurringExpenses(expenses);
  return expenses[index];
}

export function deleteRecurringExpense(id: string): boolean {
  const expenses = getRecurringExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  if (filtered.length === expenses.length) return false;
  saveRecurringExpenses(filtered);
  return true;
}

export function getRecurringExpense(id: string): RecurringExpense | undefined {
  return getRecurringExpenses().find(e => e.id === id);
}

export function getActiveRecurringExpenses(): RecurringExpense[] {
  return getRecurringExpenses().filter(e => e.isActive);
}

export function getDueRecurringExpenses(asOfDate: Date = new Date()): RecurringExpense[] {
  const active = getActiveRecurringExpenses();
  const dateStr = format(asOfDate, 'yyyy-MM-dd');
  return active.filter(e => e.nextDueDate <= dateStr && isWithinPattern(e.pattern, asOfDate));
}

export function generateRecurringExpenseInstances(asOfDate: Date = new Date()): Expense[] {
  const due = getDueRecurringExpenses(asOfDate);
  const generated: Expense[] = [];

  for (const recurring of due) {
    // Create the expense instance
    const expense = addExpense({
      amount: recurring.amount,
      currency: recurring.currency,
      category: recurring.category,
      description: recurring.description,
      date: recurring.nextDueDate,
      recurringExpenseId: recurring.id,
    });
    generated.push(expense);

    // Update the recurring expense's next due date and last generated date
    const nextDue = calculateNextDueDate(recurring.pattern, parseISO(recurring.nextDueDate));
    const nextDueStr = format(nextDue, 'yyyy-MM-dd');

    // Check if we should continue
    if (isWithinPattern(recurring.pattern, nextDue)) {
      updateRecurringExpense(recurring.id, {
        nextDueDate: nextDueStr,
        lastGeneratedDate: recurring.nextDueDate,
      });
    } else {
      // Deactivate if pattern ended
      updateRecurringExpense(recurring.id, { isActive: false });
    }
  }

  return generated;
}

export function getExpensesByRecurringId(recurringExpenseId: string): Expense[] {
  return getExpenses().filter(e => e.recurringExpenseId === recurringExpenseId);
}