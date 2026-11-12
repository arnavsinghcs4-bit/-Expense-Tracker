import { useState } from 'react';
import { getMonthlyTotal, getBudget, getCurrency } from '../storage';
import { getCurrencyInfo } from '../types';
import { format, parseISO, subMonths } from 'date-fns';

interface BudgetPanelProps {
  month: string;
  onBudgetSet: (amount: number, currency?: string) => void;
}

export function BudgetPanel({ month, onBudgetSet }: BudgetPanelProps) {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const currentBudget = getBudget(month);
  const totalSpent = getMonthlyTotal(month);
  const budget = currentBudget?.amount || 0;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const isOverBudget = totalSpent > budget && budget > 0;

  const currency = currentBudget?.currency || getCurrency();

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (!isNaN(amount) && amount > 0) {
      onBudgetSet(amount, currency);
      setBudgetAmount('');
    }
  };

  // Get last 6 months budget history
  const history = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(parseISO(month + '-01'), i);
    const monthStr = format(date, 'yyyy-MM');
    const b = getBudget(monthStr);
    const spent = getMonthlyTotal(monthStr);
    return {
      month: format(date, 'MMM yyyy'),
      monthStr,
      budget: b?.amount || 0,
      budgetCurrency: b?.currency || 'USD',
      spent,
      remaining: (b?.amount || 0) - spent,
    };
  }).reverse();

  const formatAmount = (amount: number, curr: string) => {
    const info = getCurrencyInfo(curr as any);
    return `${info.symbol}${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Current Month Budget Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Monthly Budget</h2>

        {budget > 0 ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Budget: {formatAmount(budget, currency)}</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  Spent: {formatAmount(totalSpent, currency)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverBudget ? 'bg-red-500' : percentUsed > 80 ? 'bg-yellow-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {isOverBudget ? `Over by ${formatAmount(Math.abs(remaining), currency)}` : `${percentUsed.toFixed(0)}% used`}
                </span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  Remaining: {formatAmount(remaining, currency)}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onBudgetSet(budget * 1.1, currency)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                +10%
              </button>
              <button
                onClick={() => onBudgetSet(budget * 0.9, currency)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                -10%
              </button>
              <button
                onClick={() => onBudgetSet(totalSpent, currency)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Set to Spent
              </button>
              <button
                onClick={() => onBudgetSet(0, currency)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Clear Budget
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No budget set for this month</p>
            <form onSubmit={handleSetBudget} className="max-w-xs mx-auto flex gap-2">
              <input
                type="number"
                step="0.01"
                min="1"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Enter budget amount"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Set Budget
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Budget History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remaining</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((item, index) => (
                  <tr key={item.monthStr} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.month}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      {item.budget > 0 ? formatAmount(item.budget, item.budgetCurrency) : <span className="text-gray-400 dark:text-gray-500">Not set</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">{formatAmount(item.spent, item.budgetCurrency)}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      {item.budget > 0 ? (
                        <span className={item.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                          {formatAmount(item.remaining, item.budgetCurrency)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {item.budget === 0 ? (
                        <span className="text-gray-400 dark:text-gray-500">No budget</span>
                      ) : item.remaining < 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">Over budget</span>
                      ) : item.spent === 0 ? (
                        <span className="text-gray-400 dark:text-gray-500">No spending</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium">On track</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Budget Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Budget Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Set realistic budgets based on past spending</li>
          <li>• Review and adjust monthly</li>
          <li>• Use the 50/30/20 rule: needs/wants/savings</li>
          <li>• Track daily to avoid end-of-month surprises</li>
        </ul>
      </div>
    </div>
  );
}