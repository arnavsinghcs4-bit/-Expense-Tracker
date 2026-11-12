interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeTab: 'expenses' | 'charts' | 'budget' | 'recurring';
  onTabChange: (tab: 'expenses' | 'charts' | 'budget' | 'recurring') => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function Header({ currentMonth, onMonthChange, activeTab, onTabChange, theme, onThemeChange }: HeaderProps) {
  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'charts', label: 'Charts', icon: '📊' },
    { id: 'budget', label: 'Budget', icon: '🎯' },
    { id: 'recurring', label: 'Recurring', icon: '𔄠' },
  ] as const;

  const themeOptions = [
    { value: 'light', label: '☀️ Light' },
    { value: 'dark', label: '🌙 Dark' },
    { value: 'system', label: '💻 System' },
  ] as const;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expense Tracker</h1>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={value} value={value}>{label}</option>;
              })}
            </select>

            <nav className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>

            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as 'light' | 'dark' | 'system')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Theme"
            >
              {themeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}