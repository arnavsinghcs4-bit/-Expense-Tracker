import { Expense, CATEGORY_COLORS, Category, getCurrencyInfo } from '../types';
import { deleteExpense, getExpensesByMonth } from '../storage';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { ExpenseForm } from './ExpenseForm';
import { Edit, Trash2, Receipt, Calendar, Utensils, Car, ShoppingBag, Film, Home, Heart, Plane, GraduationCap, MoreHorizontal } from 'lucide-react';

const categoryIcons: Record<Category, React.ElementType> = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Home,
  'Healthcare': Heart,
  'Travel': Plane,
  'Education': GraduationCap,
  'Other': MoreHorizontal,
};

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
      <div className="card-glass p-12 text-center animate-page-enter">
        <div className="category-pill w-16 h-16 mx-auto mb-4">
          <Receipt className="w-8 h-8" strokeWidth={2} />
        </div>
        <h3 className="heading-2 mb-2">No expenses yet</h3>
        <p className="body text-secondary max-w-md mx-auto">
          Add your first expense using the form above to start tracking your spending.
        </p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    deleteExpense(id);
    onChange();
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-5 animate-page-enter">
      {sortedDates.map((date, dateIndex) => {
        const dayExpenses = groupedExpenses[date];
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const dayCurrency = dayExpenses[0]?.currency || 'USD';
        const dayCurrencyInfo = getCurrencyInfo(dayCurrency);

        return (
          <div key={date} className="card-glass overflow-hidden animate-slide-up" style={{ animationDelay: `${dateIndex * 50}ms` }}>
            <div className="px-6 py-4 bg-secondary/30 border-b border-glass flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
                <span className="font-medium text-primary">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <span className="font-semibold text-primary mono">{dayCurrencyInfo.symbol}{dayTotal.toFixed(2)}</span>
            </div>

            <div className="divide-y divide-primary/30">
              {dayExpenses.map((expense, expenseIndex) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  isEditing={editingId === expense.id}
                  onEdit={() => setEditingId(expense.id)}
                  onSave={onChange}
                  onDeleteConfirm={() => setConfirmDeleteId(expense.id)}
                  index={expenseIndex}
                />
              ))}
            </div>
          </div>
        );
      })}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
          <div className="card-glass p-6 max-w-md w-full mx-4 animate-scale-in focus-ring" tabIndex={0}>
            <div className="flex items-center gap-3 mb-4">
              <div className="category-pill w-10 h-10" style={{ backgroundColor: 'var(--negative)' }}>
                <Trash2 className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 id="delete-confirm-title" className="heading-3">Delete expense?</h3>
            </div>
            <p className="body text-secondary mb-6">This action cannot be undone. The expense will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn btn-secondary focus-ring"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="btn btn-danger focus-ring"
              >
                <Trash2 className="w-4 h-4 mr-2" strokeWidth={2} />
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
  onDeleteConfirm,
  index
}: {
  expense: Expense;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDeleteConfirm: () => void;
  index: number;
}) {
  const category = expense.category as Category;
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const currencyInfo = getCurrencyInfo(expense.currency);
  const Icon = categoryIcons[category] || MoreHorizontal;

  if (isEditing) {
    return (
      <ExpenseForm
        editingExpense={expense}
        onSaved={onSave}
      />
    );
  }

  return (
    <div className="row-interactive px-6 py-4 flex items-center gap-4 focus-ring" tabIndex={0} style={{ animationDelay: `${index * 30}ms` }}>
      <div className="category-pill relative flex-shrink-0" style={{ backgroundColor: color + '20' }}>
        <div className="absolute inset-0 bg-accent-gradient-radial opacity-30" />
        <Icon className="w-5 h-5 relative" strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-primary truncate">{expense.description}</p>
        <p className="caption text-muted capitalize">{expense.category}</p>
      </div>

      <span className="font-semibold text-primary mono flex-shrink-0">{currencyInfo.symbol}{expense.amount.toFixed(2)}</span>

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="btn-icon btn-icon-interactive focus-ring p-2 text-muted hover:text-primary hover:bg-hover rounded-lg"
          aria-label="Edit expense"
        >
          <Edit className="w-4 h-4" strokeWidth={2} />
        </button>
        <button
          onClick={onDeleteConfirm}
          className="btn-icon btn-icon-interactive focus-ring p-2 text-muted hover:text-negative hover:bg-negative/10 rounded-lg"
          aria-label="Delete expense"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}