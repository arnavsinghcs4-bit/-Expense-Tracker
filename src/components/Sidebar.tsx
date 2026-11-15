import { useState } from 'react';
import { useEffect } from 'react';
import { Theme } from '../storage';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Target,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  User,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Financial summary' },
  { id: 'expenses', label: 'Expenses', icon: CreditCard, description: 'Track spending' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Charts & insights' },
  { id: 'budgets', label: 'Budgets', icon: Target, description: 'Set limits' },
  { id: 'recurring', label: 'Recurring', icon: RefreshCw, description: 'Subscriptions' },
] as const;

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Preferences' },
] as const;

const themeIcons = {
  light: Sun,
  dark: Moon,
};

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
        <div className="flex items-center gap-3 px-6 py-5 border-b border-glass">
          <div className="category-pill relative overflow-hidden">
            <div className="absolute inset-0 bg-accent-gradient-radial opacity-30" />
            <span className="relative text-[16px] font-bold text-white">S</span>
          </div>
          <span className="heading-3 font-semibold">Spendly</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left focus-ring ${
                  isActive
                    ? 'bg-accent-muted text-primary border border-accent-border'
                    : 'text-secondary hover:text-primary hover:bg-hover'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 interactive-scale ${isActive ? 'text-accent-primary' : ''}`} aria-hidden="true" strokeWidth={2} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate">{item.label}</div>
                  <div className="caption truncate">{item.description}</div>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 animate-scale-in ring-2 ring-bg-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="px-4 border-t border-glass" />

        {/* Bottom Navigation */}
        <nav className="px-4 py-3 space-y-1" aria-label="Secondary navigation">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left focus-ring ${
                  isActive
                    ? 'bg-accent-muted text-primary border border-accent-border'
                    : 'text-secondary hover:text-primary hover:bg-hover'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 interactive-scale ${isActive ? 'text-accent-primary' : ''}`} aria-hidden="true" strokeWidth={2} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate">{item.label}</div>
                  <div className="caption truncate">{item.description}</div>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 animate-scale-in ring-2 ring-bg-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme Selector */}
        <div className="px-4 pb-4">
          <div className="caption text-uppercase tracking-wider mb-3">Appearance</div>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1 border border-glass">
            {(['light', 'dark'] as const).map((t) => {
              const Icon = themeIcons[t];
              return (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium focus-ring ${
                    theme === t
                      ? 'bg-elevated text-primary shadow-sm border border-primary'
                      : 'text-secondary hover:text-primary hover:bg-hover'
                  }`}
                  aria-pressed={theme === t}
                >
                  <Icon className="w-4 h-4 interactive-scale" aria-hidden="true" strokeWidth={2} />
                  <span className="hidden sm:inline capitalize">{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Avatar Section */}
        <div className="px-4 py-4 border-t border-glass">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <User className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-primary">You</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="caption text-muted">Premium</span>
                <span className="pro-badge">Pro</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" strokeWidth={2} />
          </div>
        </div>

        {/* Version info */}
        <div className="px-4 pt-2 pb-4">
          <div className="caption text-center text-muted">v1.0.0</div>
        </div>
      </div>
    </aside>
  );
}