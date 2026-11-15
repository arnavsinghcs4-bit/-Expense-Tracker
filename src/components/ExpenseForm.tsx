import { useState, useEffect } from 'react';
import { CATEGORIES, Category, Expense, CATEGORY_COLORS, getCurrencyInfo } from '../types';
import { addExpense, updateExpense, getCurrency } from '../storage';
import { format } from 'date-fns';
import {
  Utensils, Car, ShoppingBag, Film, Home, Heart, Plane, GraduationCap, MoreHorizontal,
  Calendar, Tag, X
} from 'lucide-react';
import { Select, createCategoryIcon } from './Select';

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

interface ExpenseFormProps {
  defaultDate?: string;
  onSaved: () => void;
  editingExpense?: Expense | null;
}

export function ExpenseForm({ defaultDate, onSaved, editingExpense }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food & Dining');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  const isEditing = !!editingExpense;
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

    const expenseData = {
      amount: numAmount,
      currency,
      category,
      description: description.trim(),
      date,
    };

    if (isEditing) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    setAmount('');
    setDescription('');
    setDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
    setCategory('Food & Dining');
    onSaved();
  };

  useEffect(() => {
    if (editingExpense && !amount) {
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setDate(editingExpense.date);
    }
  }, [editingExpense]);

  return (
    <div className="card-glass p-6 animate-page-enter">
      <h2 className="heading-3 mb-5">
        {isEditing ? 'Edit Expense' : 'Add Expense'}
      </h2>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-negative/10 border border-negative/30 text-negative body-sm animate-slide-up focus-ring" role="alert" tabIndex={0}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
                className="input pl-12 pr-4"
                placeholder="0.00"
                required
                autoFocus
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Date with calendar icon inside */}
          <div className="relative">
            <label className="label">Date *</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input pr-12"
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
            placeholder="e.g., Lunch with friends"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="btn btn-primary flex-1 btn-shimmer focus-ring"
          >
            {isEditing ? 'Update Expense' : 'Add Expense'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => onSaved()}
              className="btn btn-secondary focus-ring"
            >
              <X className="w-4 h-4 mr-2" strokeWidth={2} />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}