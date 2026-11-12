import { format } from 'date-fns';
import { getCurrencyInfo } from '../types';
import { getCurrency } from '../storage';

interface TopbarProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeTab: string;
  onMenuClick: () => void;
  primaryAction?: React.ReactNode;
}

const pageTitles: Record<string, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'Your financial summary at a glance' },
  expenses: { title: 'Expenses', description: 'Track and manage your spending' },
  analytics: { title: 'Analytics', description: 'Insights into your financial habits' },
  budgets: { title: 'Budgets', description: 'Set limits and stay on track' },
  recurring: { title: 'Recurring', description: 'Manage subscriptions and bills' },
  settings: { title: 'Settings', description: 'Customize your experience' },
};

export function Topbar({ currentMonth, onMonthChange, activeTab, onMenuClick, primaryAction }: TopbarProps) {
  const pageInfo = pageTitles[activeTab] || { title: 'Spendly', description: '' };
  const currency = getCurrency();
  const currencyInfo = getCurrencyInfo(currency);
  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy');

  const handlePrevMonth = () => {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    onMonthChange(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() + 1);
    onMonthChange(date.toISOString().slice(0, 7));
  };

  return (
    <header className="topbar" role="banner">
      <div className="max-w-full mx-auto px-6 h-full flex items-center justify-between gap-4">
        {/* Left: Menu button + Page title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="btn-ghost btn-icon lg:hidden"
            aria-label="Open menu"
            aria-expanded="false"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="heading-2 truncate">{pageInfo.title}</h1>
            {pageInfo.description && (
              <p className="caption truncate">{pageInfo.description}</p>
            )}
          </div>
        </div>

        {/* Center: Month selector */}
        <div className="flex items-center gap-3 hidden md:flex">
          <button
            onClick={handlePrevMonth}
            className="btn-ghost btn-icon p-2"
            aria-label="Previous month"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="px-4 py-2 bg-secondary rounded-xl border border-primary text-center min-w-[160px]">
            <span className="font-medium text-primary whitespace-nowrap">{monthLabel}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="btn-ghost btn-icon p-2"
            aria-label="Next month"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Right: Currency + Primary Action */}
        <div className="flex items-center gap-3">
          {/* Currency display */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-secondary rounded-xl border border-primary">
            <span className="text-[18px]" aria-hidden="true">{currencyInfo.symbol}</span>
            <span className="font-medium text-primary">{currencyInfo.code}</span>
          </div>

          {/* Primary action */}
          {primaryAction && (
            <div className="hidden sm:block">
              {primaryAction}
            </div>
          )}

          {/* Mobile primary action */}
          <div className="sm:hidden">
            {primaryAction}
          </div>
        </div>
      </div>
    </header>
  );
}