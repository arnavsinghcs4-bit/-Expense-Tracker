import { useState, useEffect } from 'react';
import { CATEGORIES, Category, RecurringExpense, RecurrencePattern, RecurrenceFrequency, RECURRENCE_LABELS, CATEGORY_COLORS, getCurrencyInfo } from '../types';
import { getRecurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, getActiveRecurringExpenses, generateRecurringExpenseInstances, getCurrency } from '../storage';
import { format, parseISO } from 'date-fns';
import { RefreshCw, Edit, Trash2, ToggleRight, ToggleLeft, Plus, X, Calendar, Tag, Repeat } from 'lucide-react';
import { Select, createCategoryIcon } from './Select';

import { Utensils, Car, ShoppingBag, Film, Home, Heart, Plane, GraduationCap, MoreHorizontal } from 'lucide-react';

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

const categoryOptions = CATEGORIES.map(cat => ({
  value: cat as Category,
  label: cat,
  icon: createCategoryIcon(categoryIcons[cat as Category] || MoreHorizontal, CATEGORY_COLORS[cat as Category]),
}));

function getPatternDescription(pattern: RecurrencePattern): string {
  const freqLabel = RECURRENCE_LABELS[pattern.frequency];
  const interval = pattern.interval;
  let desc = '';

  if (interval === 1) {
    desc = freqLabel;
  } else {
    desc = `Every ${interval} ${freqLabel.toLowerCase()}${interval > 1 ? 's' : ''}`;
  }

  const startStr = format(parseISO(pattern.startDate), 'MMM d, yyyy');
  desc += ` starting ${startStr}`;

  if (pattern.endDate) {
    const endStr = format(parseISO(pattern.endDate), 'MMM d, yyyy');
    desc += ` until ${endStr}`;
  }
  if (pattern.occurrences) {
    desc += ` (${pattern.occurrences} times)`;
  }

  return desc;
}

interface RecurringExpensesProps {
  onChange: () => void;
}

export function RecurringExpenses({ onChange }: RecurringExpensesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food & Dining');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [interval, setInterval] = useState(1);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState('');
  const [error, setError] = useState('');

  const recurringExpenses = getRecurringExpenses();
  const activeExpenses = getActiveRecurringExpenses();
  const inactiveExpenses = recurringExpenses.filter(e => !e.isActive);

  const isEditing = !!editingId;
  const editingExpense = editingId ? recurringExpenses.find(e => e.id === editingId) : null;

  // Use global currency
  const currency = getCurrency();
  const currencyInfo = getCurrencyInfo(currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    const pattern: RecurrencePattern = {
      frequency,
      interval: parseInt(interval.toString()) || 1,
      startDate,
      endDate: endDate || undefined,
      occurrences: occurrences ? parseInt(occurrences) : undefined,
    };

    const expenseData = {
      amount: numAmount,
      currency,
      category,
      description: description.trim(),
      pattern,
      isActive: true,
    };

    if (isEditing) {
      updateRecurringExpense(editingId!, expenseData);
    } else {
      addRecurringExpense(expenseData);
    }

    resetForm();
    onChange();
  };

  const handleEdit = (id: string) => {
    const exp = recurringExpenses.find(e => e.id === id);
    if (!exp) return;

    setEditingId(id);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDescription(exp.description);
    setFrequency(exp.pattern.frequency);
    setInterval(exp.pattern.interval);
    setStartDate(exp.pattern.startDate);
    setEndDate(exp.pattern.endDate || '');
    setOccurrences(exp.pattern.occurrences?.toString() || '');
    setShowForm(true);
  };

  const handleToggleActive = (expense: RecurringExpense) => {
    updateRecurringExpense(expense.id, { isActive: !expense.isActive });
    onChange();
  };

  const handleDelete = (id: string) => {
    deleteRecurringExpense(id);
    setConfirmDeleteId(null);
    onChange();
  };

  const handleGenerateNow = () => {
    generateRecurringExpenseInstances();
    onChange();
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setAmount('');
    setCategory('Food & Dining');
    setDescription('');
    setFrequency('monthly');
    setInterval(1);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setOccurrences('');
  };

  useEffect(() => {
    if (editingExpense && !amount) {
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setFrequency(editingExpense.pattern.frequency);
      setInterval(editingExpense.pattern.interval);
      setStartDate(editingExpense.pattern.startDate);
      setEndDate(editingExpense.pattern.endDate || '');
      setOccurrences(editingExpense.pattern.occurrences?.toString() || '');
    }
  }, [editingExpense]);

  
  return (
    <div className="space-y-6 animate-page-enter">
      {/* Add/Edit Form */}
      <div className="card-glass p-6 stagger-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-3">
            {isEditing ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </h2>
          {!isEditing && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`btn btn-shimmer focus-ring ${showForm ? 'btn-secondary' : 'btn-primary'}`}
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4 mr-2" strokeWidth={2} />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
                  Add Recurring Expense
                </>
              )}
            </button>
          )}
        </div>

        {(showForm || isEditing) && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-down">
            {error && (
              <div className="p-3 rounded-lg bg-negative/10 border border-negative/30 text-negative body-sm animate-slide-up focus-ring" role="alert" tabIndex={0}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount with currency symbol prefix */}
              <div className="relative">
                <label className="label">Amount *</label>
                <div className="relative">
                  <span className="input-prefix">{currencyInfo.symbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input pl-12 pr-4 focus-ring"
                    placeholder="0.00"
                    required
                    autoFocus
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Start Date with calendar icon inside */}
              <div className="relative">
                <label className="label">Start Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input pr-12 focus-ring"
                    required
                  />
                  <Calendar className="input-suffix" strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Category - Custom Select Dropdown (in-flow) */}
            <div>
              <label className="label">Category *</label>
              <Select<Category>
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="Select category"
                prefix={<Tag className="input-icon" strokeWidth={2} />}
                inFlow
                ariaLabel="Select expense category"
              />
            </div>

            <div>
              <label className="label">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input focus-ring"
                placeholder="e.g., Netflix subscription"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Frequency *</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="select focus-ring"
                >
                  {(Object.keys(RECURRENCE_LABELS) as RecurrenceFrequency[]).map(freq => (
                    <option key={freq} value={freq}>{RECURRENCE_LABELS[freq]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Interval</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="input focus-ring"
                />
              </div>

              <div className="relative">
                <label className="label">End Date (optional)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input pr-12 focus-ring"
                  />
                  <Calendar className="input-suffix" strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Max Occurrences (optional)</label>
              <input
                type="number"
                min="1"
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
                className="input focus-ring"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-primary btn-shimmer flex-1 focus-ring"
              >
                {isEditing ? 'Update Recurring Expense' : 'Add Recurring Expense'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary focus-ring"
                >
                  <X className="w-4 h-4 mr-2" strokeWidth={2} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Generate Now Button */}
      <div className="card-glass p-6 stagger-2">
        <button
          onClick={handleGenerateNow}
          className="btn btn-primary btn-shimmer w-full py-4 focus-ring"
        >
          <Repeat className="w-5 h-5 mr-2" strokeWidth={2} />
          <span>Generate Due Expenses Now</span>
        </button>
        <p className="body-sm text-secondary mt-3 text-center">
          Checks all active recurring expenses and creates expense entries for any that are due.
        </p>
      </div>

      {/* Active Recurring Expenses */}
      {activeExpenses.length > 0 && (
        <div className="card-glass overflow-hidden stagger-3">
          <div className="px-6 py-4 border-b border-glass flex items-center justify-between">
            <h3 className="heading-4">Active Recurring Expenses <span className="text-muted font-normal">({activeExpenses.length})</span></h3>
          </div>
          <div className="divide-y divide-primary/30">
            {activeExpenses.map((expense, index) => (
              <RecurringExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onToggle={handleToggleActive}
                onDeleteConfirm={() => setConfirmDeleteId(expense.id)}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Recurring Expenses */}
      {inactiveExpenses.length > 0 && (
        <div className="card-glass overflow-hidden stagger-4">
          <div className="px-6 py-4 border-b border-glass flex items-center justify-between">
            <h3 className="heading-4">Inactive <span className="text-muted font-normal">({inactiveExpenses.length})</span></h3>
          </div>
          <div className="divide-y divide-primary/30">
            {inactiveExpenses.map((expense, index) => (
              <RecurringExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onToggle={handleToggleActive}
                onDeleteConfirm={() => setConfirmDeleteId(expense.id)}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recurringExpenses.length === 0 && (
        <div className="card-glass p-12 text-center stagger-1 animate-page-enter">
          <div className="category-pill w-16 h-16 mx-auto mb-4" style={{ backgroundColor: 'var(--accent-muted)' }}>
            <RefreshCw className="w-8 h-8" strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 className="heading-2 mb-2">No recurring expenses yet</h3>
          <p className="body text-secondary max-w-md mx-auto mb-6">
            Add your first recurring expense above to track subscriptions, bills, and regular payments automatically.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-shimmer focus-ring"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
            Add Recurring Expense
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="delete-recurring-title">
          <div className="card-glass p-6 max-w-md w-full mx-4 animate-scale-in focus-ring" tabIndex={0}>
            <div className="flex items-center gap-3 mb-4">
              <div className="category-pill w-10 h-10" style={{ backgroundColor: 'var(--negative)' }}>
                <Trash2 className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 id="delete-recurring-title" className="heading-3">Delete recurring expense?</h3>
            </div>
            <p className="body text-secondary mb-6">This will stop future expenses from being generated. Already generated expenses will not be affected.</p>
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

function RecurringExpenseItem({
  expense,
  onEdit,
  onToggle,
  onDeleteConfirm,
  index
}: {
  expense: RecurringExpense;
  onEdit: (id: string) => void;
  onToggle: (expense: RecurringExpense) => void;
  onDeleteConfirm: () => void;
  index: number;
}) {
  const nextDue = format(parseISO(expense.nextDueDate), 'MMM d, yyyy');
  const patternDesc = getPatternDescription(expense.pattern);
  const currencyInfo = getCurrencyInfo(expense.currency);
  const category = expense.category as Category;
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const Icon = categoryIcons[category] || MoreHorizontal;
  const daysUntil = Math.ceil((parseISO(expense.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="row-interactive px-6 py-5 flex items-center gap-4 focus-ring animate-slide-up" tabIndex={0} style={{ animationDelay: `${index * 30}ms` }}>
      <div className="category-pill relative flex-shrink-0" style={{ backgroundColor: color + '20' }}>
        <div className="absolute inset-0 bg-accent-gradient-radial opacity-30" />
        <Icon className="w-5 h-5 relative" strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-primary truncate">{expense.description}</p>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-muted text-accent-primary border border-accent-border/30">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
            Active
          </span>
        </div>
        <p className="caption text-muted capitalize mt-1">{expense.category}</p>
        <p className="caption text-muted mt-1 flex items-center gap-1">
          <span>{patternDesc}</span>
          <span className="text-muted/50">·</span>
          <span className="flex items-center gap-1" style={{ color: daysUntil <= 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
            <Calendar className="w-3 h-3" strokeWidth={2} />
            Due in {daysUntil}d ({nextDue})
          </span>
        </p>
      </div>

      <div className="flex flex-col items-end gap-3">
        <span className="font-semibold text-primary mono">{currencyInfo.symbol}{expense.amount.toFixed(2)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(expense.id)}
            className="btn-icon btn-icon-interactive focus-ring p-2 text-muted hover:text-primary hover:bg-hover rounded-lg"
            aria-label="Edit recurring expense"
          >
            <Edit className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={onDeleteConfirm}
            className="btn-icon btn-icon-interactive focus-ring p-2 text-muted hover:text-negative hover:bg-negative/10 rounded-lg"
            aria-label="Delete recurring expense"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <button
          onClick={() => onToggle(expense)}
          className="btn btn-secondary btn-sm btn-shimmer focus-ring"
        >
          {expense.isActive ? (
            <>
              <ToggleLeft className="w-3 h-3 mr-1.5" strokeWidth={2} />
              Deactivate
            </>
          ) : (
            <>
              <ToggleRight className="w-3 h-3 mr-1.5" strokeWidth={2} />
              Activate
            </>
          )}
        </button>
      </div>
    </div>
  );
}