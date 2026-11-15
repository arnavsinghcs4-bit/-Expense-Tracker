import { useState } from 'react';
import { getMonthlyTotal, getBudget, getCurrency } from '../storage';
import { getCurrencyInfo } from '../types';
import { format, parseISO, subMonths } from 'date-fns';
import { ChevronDown, Target, Plus, Minus, Check, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface BudgetPanelProps {
  month: string;
  onBudgetSet: (amount: number) => void;
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

  const currency = getCurrency();
  const currencyInfo = getCurrencyInfo(currency);

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (!isNaN(amount) && amount > 0) {
      onBudgetSet(amount);
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

  const formatAmount = (amount: number) => {
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Current Month Budget Card */}
      <div className="card-glass p-6 stagger-1">
        <div className="flex items-center gap-2 mb-6">
          <div className="category-pill" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <Target className="w-5 h-5" strokeWidth={2} />
          </div>
          <h2 className="heading-3">Monthly Budget</h2>
        </div>

        {budget > 0 ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="bg-secondary/30 rounded-xl p-5">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-secondary">Budget</span>
                <span className="font-medium mono text-primary">{formatAmount(budget)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-secondary">Spent</span>
                <span className={`font-medium mono ${isOverBudget ? 'text-negative' : 'text-primary'}`}>
                  {formatAmount(totalSpent)}
                </span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-700 ease-out rounded-full`}
                  style={{
                    width: `${Math.min(percentUsed, 100)}%`,
                    background: isOverBudget ? 'var(--negative)' : percentUsed > 80 ? 'var(--warning)' : 'var(--accent-gradient)'
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {isOverBudget ? `Over by ${formatAmount(Math.abs(remaining))}` : `${percentUsed.toFixed(0)}% utilized`}
                </span>
                <span className={`font-medium mono ${isOverBudget ? 'text-negative' : 'text-positive'}`}>
                  Remaining: {formatAmount(Math.max(0, remaining))}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <QuickActionButton
                icon={Plus}
                label="+10%"
                onClick={() => onBudgetSet(budget * 1.1)}
                accentColor="var(--accent-primary)"
              />
              <QuickActionButton
                icon={Minus}
                label="-10%"
                onClick={() => onBudgetSet(budget * 0.9)}
                accentColor="var(--accent-to)"
              />
              <QuickActionButton
                icon={Check}
                label="Set to Spent"
                onClick={() => onBudgetSet(totalSpent)}
                accentColor="var(--positive)"
              />
              <QuickActionButton
                icon={Trash2}
                label="Clear"
                onClick={() => onBudgetSet(0)}
                accentColor="var(--negative)"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-10 animate-slide-up">
            <div className="category-pill w-16 h-16 mx-auto mb-4" style={{ backgroundColor: 'var(--accent-muted)' }}>
              <Target className="w-8 h-8" strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 className="heading-2 mb-2">No budget set</h3>
            <p className="body text-secondary mb-6">Set a monthly budget to track your spending against targets.</p>
            <form onSubmit={handleSetBudget} className="max-w-sm mx-auto flex gap-3">
              <div className="relative flex-1">
                <span className="input-prefix">{currencyInfo.symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="Enter budget amount"
                  className="input pl-12 pr-4 focus-ring"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-shimmer focus-ring whitespace-nowrap"
              >
                Set Budget
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Budget History */}
      <div className="card-glass overflow-hidden stagger-2">
        <div className="p-6 border-b border-glass flex items-center justify-between">
          <h3 className="heading-4">Budget History (6 months)</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-ghost btn-icon btn-icon-interactive focus-ring"
            aria-expanded={showHistory}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} strokeWidth={2} />
          </button>
        </div>

        {showHistory && (
          <div className="px-6 pb-6 animate-slide-down">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/30">
                    <th className="px-4 py-3 text-left caption text-uppercase tracking-wider text-muted">Month</th>
                    <th className="px-4 py-3 text-right caption text-uppercase tracking-wider text-muted">Budget</th>
                    <th className="px-4 py-3 text-right caption text-uppercase tracking-wider text-muted">Spent</th>
                    <th className="px-4 py-3 text-right caption text-uppercase tracking-wider text-muted">Remaining</th>
                    <th className="px-4 py-3 text-right caption text-uppercase tracking-wider text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/30">
                  {history.map((item, index) => (
                    <tr key={item.monthStr} className="row-interactive animate-slide-up focus-ring" tabIndex={0} style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="px-4 py-4 font-medium text-primary">{item.month}</td>
                      <td className="px-4 py-4 text-right">
                        {item.budget > 0 ? (
                          <span className="font-medium mono text-primary">{formatAmount(item.budget)}</span>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-medium mono text-primary">{formatAmount(item.spent)}</td>
                      <td className="px-4 py-4 text-right">
                        {item.budget > 0 ? (
                          <span className={`font-medium mono ${item.remaining < 0 ? 'text-negative' : 'text-positive'}`}>
                            {formatAmount(item.remaining)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.budget === 0 ? (
                          <span className="caption text-muted">No budget</span>
                        ) : item.remaining < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-negative/10 text-negative caption font-medium">
                            <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                            Over budget
                          </span>
                        ) : item.spent === 0 ? (
                          <span className="caption text-muted">No spending</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-positive/10 text-positive caption font-medium">
                            <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} />
                            On track
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Budget Tips */}
      <div className="card-glass p-6 border border-accent-border/30 bg-accent-muted/20 stagger-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="category-pill" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <Target className="w-4 h-4" strokeWidth={2} />
          </div>
          <h4 className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Budget Tips</h4>
        </div>
        <ul className="body-sm text-secondary space-y-2">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} /> Set realistic budgets based on past spending patterns</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} /> Review and adjust monthly as circumstances change</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} /> Use the 50/30/20 rule: needs / wants / savings</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} /> Track daily to avoid end-of-month surprises</li>
        </ul>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, accentColor }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="btn btn-secondary btn-shimmer focus-ring py-3 text-sm justify-center"
      style={{ borderColor: `${accentColor}40` }}
    >
      <Icon className="w-4 h-4 mr-1.5" strokeWidth={2} style={{ color: accentColor }} />
      <span className="font-medium" style={{ color: accentColor }}>{label}</span>
    </button>
  );
}

