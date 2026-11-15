import { format } from 'date-fns';
import { useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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
  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy');
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Could add blur logic here if needed
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar" role="banner">
      <div className="max-w-full mx-auto px-6 h-full flex items-center justify-between gap-4">
        {/* Left: Menu button + Page title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="btn-ghost btn-icon lg:hidden btn-icon-interactive focus-ring"
            aria-label="Open menu"
            aria-expanded="false"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <div className="min-w-0 animate-slide-down animate-page-enter">
            <h1 className="heading-2 truncate">{pageInfo.title}</h1>
            {pageInfo.description && (
              <p className="caption truncate">{pageInfo.description}</p>
            )}
          </div>
        </div>

        {/* Center: Month selector + Search */}
        <div className="flex items-center gap-4 hidden md:flex flex-1 justify-center max-w-2xl">
          {/* Month Selector - Custom Pill/Chip */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="btn-ghost btn-icon p-2 btn-icon-interactive focus-ring rounded-full"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <div className="month-selector interactive-scale">
              <span className="font-medium text-primary whitespace-nowrap">{monthLabel}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="btn-ghost btn-icon p-2 btn-icon-interactive focus-ring rounded-full"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border-primary mx-2 hidden lg:block" />

          {/* Global Search Bar */}
          <div className="search-bar flex-1 max-w-md relative" ref={searchRef}>
            <Search className="w-4 h-4 flex-shrink-0" strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search expenses, budgets..."
              className="bg-transparent border-none outline-none w-full text-primary placeholder:text-muted"
              aria-label="Search"
            />
            <kbd className="hidden sm:inline-flex">⌘K</kbd>
          </div>
        </div>

        {/* Right: Primary Action + Notification */}
        <div className="flex items-center gap-3">
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

          {/* Notification Bell */}
          <button
            className="btn-ghost btn-icon relative notification-badge btn-icon-interactive focus-ring"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}