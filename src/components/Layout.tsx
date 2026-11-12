import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getTheme, setTheme, Theme, getEffectiveTheme } from '../storage';

interface LayoutProps {
  children: React.ReactNode;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  primaryAction?: React.ReactNode;
}

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
          {children}
        </main>
      </div>
    </div>
  );
}