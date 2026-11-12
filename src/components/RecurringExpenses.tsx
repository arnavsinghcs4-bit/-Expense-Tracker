import { useState } from 'react';
import { CATEGORIES, Category, RecurringExpense, RecurrencePattern, RecurrenceFrequency, RECURRENCE_LABELS, CATEGORY_COLORS, Currency, CURRENCIES, getCurrencyInfo } from '../types';
import { getRecurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, getActiveRecurringExpenses, generateRecurringExpenseInstances, getCurrency } from '../storage';
import { format, parseISO } from 'date-fns';

interface RecurringExpensesProps {
  onChange: () => void;
}

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

export function RecurringExpenses({ onChange }: RecurringExpensesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(() => getCurrency());
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
    setCurrency(exp.currency);
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
    setCurrency(getCurrency());
  };

  if (editingExpense && !amount) {
    setAmount(editingExpense.amount.toString());
    setCurrency(editingExpense.currency);
    setCategory(editingExpense.category);
    setDescription(editingExpense.description);
    setFrequency(editingExpense.pattern.frequency);
    setInterval(editingExpense.pattern.interval);
    setStartDate(editingExpense.pattern.startDate);
    setEndDate(editingExpense.pattern.endDate || '');
    setOccurrences(editingExpense.pattern.occurrences?.toString() || '');
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </h2>
          {!isEditing && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showForm
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showForm ? 'Cancel' : '+ Add Recurring Expense'}
            </button>
          )}
        </div>

        {showForm || isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Netflix subscription"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency *</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {(Object.keys(RECURRENCE_LABELS) as RecurrenceFrequency[]).map(freq => (
                    <option key={freq} value={freq}>{RECURRENCE_LABELS[freq]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interval</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Occurrences (optional)</label>
              <input
                type="number"
                min="1"
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Update' : 'Add Recurring Expense'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : null}
      </div>

      {/* Generate Now Button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={handleGenerateNow}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          🔄 Generate Due Expenses Now
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          Checks all active recurring expenses and creates expense entries for any that are due.
        </p>
      </div>

      {/* Active Recurring Expenses */}
      {activeExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Recurring Expenses ({activeExpenses.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeExpenses.map(expense => (
              <RecurringExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onToggle={handleToggleActive}
                onDeleteConfirm={() => setConfirmDeleteId(expense.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Recurring Expenses */}
      {inactiveExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inactive ({inactiveExpenses.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {inactiveExpenses.map(expense => (
              <RecurringExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onToggle={handleToggleActive}
                onDeleteConfirm={() => setConfirmDeleteId(expense.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recurringExpenses.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-4xl mb-3">𔄠</div>
          <p className="text-gray-500 dark:text-gray-400">No recurring expenses yet. Add your first one above!</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete recurring expense?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">This will stop future expenses from being generated. Already generated expenses will not be affected.</p>
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

function RecurringExpenseItem({
  expense,
  onEdit,
  onToggle,
  onDeleteConfirm
}: {
  expense: RecurringExpense;
  onEdit: (id: string) => void;
  onToggle: (expense: RecurringExpense) => void;
  onDeleteConfirm: () => void;
}) {
  const nextDue = format(parseISO(expense.nextDueDate), 'MMM d, yyyy');
  const patternDesc = getPatternDescription(expense.pattern);
  const currencyInfo = getCurrencyInfo(expense.currency);

  return (
    <div className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium flex-shrink-0"
          style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#6b7280' }}
        >
          {expense.category.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white truncate">{expense.description}</p>
            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{expense.category}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{patternDesc}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">{currencyInfo.symbol}{expense.amount.toFixed(2)}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Next: {nextDue}</span>
            <button
              onClick={() => onEdit(expense.id)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Edit"
            >
              ✏️
            </button>
            <button
              onClick={onDeleteConfirm}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Delete"
            >
              🗑️
            </button>
          </div>
          <button
            onClick={() => onToggle(expense)}
            className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}