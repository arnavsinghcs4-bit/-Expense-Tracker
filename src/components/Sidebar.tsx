import { useState } from 'react';
import { useEffect } from 'react';
import { Theme } from '../storage';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: '📈', description: 'Financial summary' },
  { id: 'expenses', label: 'Expenses', icon: '💳', description: 'Track spending' },
  { id: 'analytics', label: 'Analytics', icon: '📊', description: 'Charts & insights' },
  { id: 'budgets', label: 'Budgets', icon: '🎯', description: 'Set limits' },
  { id: 'recurring', label: 'Recurring', icon: '𔄠', description: 'Subscriptions' },
] as const;

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Preferences' },
] as const;

export function Sidebar({ activeTab, onTabChange, theme, onThemeChange, isOpen, onClose }: SidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    onThemeChange(newTheme);
    // Keep sidebar open on desktop, close on mobile
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  if (!mounted) {
    return (
      <aside className="sidebar" aria-hidden="true">
        <div className="flex h-full flex-col" />
      </aside>
    );
  }

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      role="navigation"
      aria-label="Main navigation"
      aria-hidden={!isOpen && window.innerWidth < 1024}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-primary">
            <span className="text-[16px] font-bold text-primary" style={{ color: 'var(--bg-primary)' }}>S</span>
          </div>
          <span className="heading-3">Spendly</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-accent-muted text-primary border border-accent-border'
                  : 'text-secondary hover:text-primary hover:bg-hover surface-hover'
              }`}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <span className="text-[20px] flex-shrink-0" aria-hidden="true">{item.icon}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{item.label}</div>
                <div className="caption truncate">{item.description}</div>
              </div>
              {activeTab === item.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="px-4 border-t border-primary" />

        {/* Bottom Navigation */}
        <nav className="px-4 py-4 space-y-1" aria-label="Secondary navigation">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-accent-muted text-primary border border-accent-border'
                  : 'text-secondary hover:text-primary hover:bg-hover surface-hover'
              }`}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <span className="text-[20px] flex-shrink-0" aria-hidden="true">{item.icon}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{item.label}</div>
                <div className="caption truncate">{item.description}</div>
              </div>
              {activeTab === item.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>

        {/* Theme Selector */}
        <div className="px-4 pb-6">
          <div className="caption text-uppercase tracking-wider mb-3">Appearance</div>
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-1 border border-primary">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t as Theme)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  theme === t
                    ? 'bg-elevated text-primary shadow-sm border border-primary'
                    : 'text-secondary hover:text-primary hover:bg-hover'
                }`}
                aria-pressed={theme === t}
              >
                <span className="text-[16px]" aria-hidden="true">
                  {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                </span>
                <span className="hidden sm:inline capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Version info */}
        <div className="px-4 pt-4 border-t border-primary">
          <div className="caption text-center">v1.0.0</div>
        </div>
      </div>
    </aside>
  );
}