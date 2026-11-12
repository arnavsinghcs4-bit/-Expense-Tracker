import { Expense, CATEGORY_COLORS, Category, getCurrencyInfo } from '../types';
import { deleteExpense, getExpensesByMonth } from '../storage';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { ExpenseForm } from './ExpenseForm';

interface ExpenseListProps {
  expenses: Expense[];
  onChange: () => void;
  filterMonth?: string;
}

export function ExpenseList({ expenses, onChange, filterMonth }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredExpenses = filterMonth
    ? getExpensesByMonth(filterMonth)
    : expenses;

  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = expense.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (filteredExpenses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-500 dark:text-gray-400">No expenses yet. Add your first expense above!</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    deleteExpense(id);
    onChange();
  };

  
  return (
    <div className="space-y-4">
      {sortedDates.map(date => {
        const dayExpenses = groupedExpenses[date];
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        // Use the first expense's currency for the day total, or default
        const dayCurrency = dayExpenses[0]?.currency || 'USD';
        const dayCurrencyInfo = getCurrencyInfo(dayCurrency);

        return (
          <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{dayCurrencyInfo.symbol}{dayTotal.toFixed(2)}</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {dayExpenses.map(expense => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  isEditing={editingId === expense.id}
                  onEdit={() => setEditingId(expense.id)}
                  onSave={onChange}
                  onDeleteConfirm={() => setConfirmDeleteId(expense.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete expense?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseItem({
  expense,
  isEditing,
  onEdit,
  onSave,
  onDeleteConfirm
}: {
  expense: Expense;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDeleteConfirm: () => void;
}) {
  const color = CATEGORY_COLORS[expense.category as Category] || '#6b7280';
  const currencyInfo = getCurrencyInfo(expense.currency);

  if (isEditing) {
    return (
      <ExpenseForm
        editingExpense={expense}
        onSaved={onSave}
      />
    );
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
        style={{ backgroundColor: color }}
      >
        {expense.category.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{expense.description}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{expense.category}</p>
      </div>

      <span className="font-semibold text-gray-900 dark:text-white">{currencyInfo.symbol}{expense.amount.toFixed(2)}</span>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Edit"
        >
          ✏️
        </button>
        <button
          onClick={onDeleteConfirm}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          aria-label="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}