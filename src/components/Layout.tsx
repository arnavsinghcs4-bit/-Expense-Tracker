import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getTheme, setTheme, Theme, getEffectiveTheme } from '../storage';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Target,
  RefreshCw,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  primaryAction?: React.ReactNode;
}

const bottomNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'recurring', label: 'Recurring', icon: RefreshCw },
] as const;

export function Layout({
  children,
  currentMonth,
  onMonthChange,
  activeTab,
  onTabChange,
  primaryAction
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const effectiveTheme = getEffectiveTheme();
    setThemeState(getTheme());
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getTheme() === 'system') {
        const newEffective = getEffectiveTheme();
        document.documentElement.setAttribute('data-theme', newEffective);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const effective = newTheme === 'system'
      ? getEffectiveTheme()
      : newTheme;
    document.documentElement.setAttribute('data-theme', effective);
    setThemeState(newTheme);
  };

  if (!mounted) {
    return (
      <div className="layout" style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="layout">
      {/* Sidebar Overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        theme={theme}
        onThemeChange={handleThemeChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col min-h-0">
        {/* Topbar */}
        <Topbar
          currentMonth={currentMonth}
          onMonthChange={onMonthChange}
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen(true)}
          primaryAction={primaryAction}
        />

        {/* Main content */}
        <main className="main" role="main" tabIndex={-1}>
          <div className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Bottom navigation">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}