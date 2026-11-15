import { useState, useEffect } from 'react';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Charts } from './components/Charts';
import { BudgetPanel } from './components/BudgetPanel';
import { RecurringExpenses } from './components/RecurringExpenses';
import { Overview } from './components/Overview';
import { Layout } from './components/Layout';
import { Select } from './components/Select';
import { getRecentExpenses, setBudget, generateRecurringExpenseInstances, getCurrency, setCurrency } from './storage';
import { format } from 'date-fns';
import { Currency, CURRENCIES, getCurrencyInfo } from './types';

type Tab = 'overview' | 'expenses' | 'analytics' | 'budgets' | 'recurring' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [expenses, setExpenses] = useState(() => getRecentExpenses(50));
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  // Generate recurring expense instances on load
  useEffect(() => {
    generateRecurringExpenseInstances();
    setExpenses(getRecentExpenses(50));
    setTriggerRefresh(t => t + 1);
  }, []);

  const handleExpenseChange = () => {
    setExpenses(getRecentExpenses(50));
    setTriggerRefresh(t => t + 1);
  };

  // Primary actions per tab
  const getPrimaryAction = () => {
    switch (activeTab) {
      case 'expenses':
        return null; // ExpenseForm is inline
      case 'budgets':
        return null; // BudgetPanel handles its own actions
      case 'recurring':
        return null; // RecurringExpenses handles its own actions
      default:
        return null;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  const handleBudgetSet = (amount: number) => {
    setBudget(currentMonth, amount);
    setTriggerRefresh(t => t + 1);
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setTriggerRefresh(t => t + 1);
  };

  return (
    <Layout
      currentMonth={currentMonth}
      onMonthChange={setCurrentMonth}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      primaryAction={getPrimaryAction()}
    >
      {activeTab === 'overview' && (
        <Overview
          month={currentMonth}
          key={triggerRefresh}
        />
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-slide-up">
          <ExpenseForm
            defaultDate={currentMonth + '-01'}
            onSaved={handleExpenseChange}
          />
          <ExpenseList
            expenses={expenses}
            onChange={handleExpenseChange}
            filterMonth={currentMonth}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <Charts
          month={currentMonth}
          key={triggerRefresh}
        />
      )}

      {activeTab === 'budgets' && (
        <BudgetPanel
          month={currentMonth}
          onBudgetSet={handleBudgetSet}
          key={triggerRefresh}
        />
      )}

      {activeTab === 'recurring' && (
        <RecurringExpenses
          onChange={handleExpenseChange}
          key={triggerRefresh}
        />
      )}

      {activeTab === 'settings' && (
        <div className="animate-slide-up">
          <Settings onCurrencyChange={handleCurrencyChange} />
        </div>
      )}
    </Layout>
  );
}

// Settings component with global currency preference
function Settings({ onCurrencyChange }: { onCurrencyChange: (currency: Currency) => void }) {
  const currentCurrency = getCurrency();
  const currencyInfo = getCurrencyInfo(currentCurrency);

  const currencyOptions = CURRENCIES.map(c => ({
    value: c.code as Currency,
    label: `${c.symbol} ${c.code} — ${c.name}`,
    icon: <span className="category-pill" style={{ backgroundColor: 'var(--accent-primary)', width: 28, height: 28 }}><span className="text-white font-medium text-sm">{c.symbol}</span></span>,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card-glass p-6">
        <h2 className="heading-2 mb-6">Settings</h2>

        {/* Regional Preferences */}
        <div>
          <h3 className="heading-4 mb-4">Regional Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Default Currency</label>
              <Select<Currency>
                value={currentCurrency}
                onChange={onCurrencyChange}
                options={currencyOptions}
                placeholder="Select currency"
                searchable
                ariaLabel="Select default currency"
              />
              <p className="body-sm text-muted mt-2">
                This currency will be used for new expenses, budgets, and recurring expenses.
                Existing expenses keep their original currency.
              </p>
            </div>

            <div className="card-glass p-4 border border-accent-border/30 bg-accent-muted/20">
              <div className="flex items-center gap-4">
                <div className="category-pill" style={{ backgroundColor: 'var(--accent-primary)' }}>
                  <span className="text-white font-medium text-lg">{currencyInfo.symbol}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-primary">Current: {currencyInfo.code} — {currencyInfo.name}</p>
                  <p className="body-sm text-secondary">
                    Symbol: <span className="mono">{currencyInfo.symbol}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-glass pt-6">
          <h3 className="heading-4 mb-4">Account</h3>
          <p className="body-sm text-secondary">Account settings coming soon.</p>
        </div>
        <div>
          <h3 className="heading-4 mb-4">Preferences</h3>
          <p className="body-sm text-secondary">Additional preference options coming soon.</p>
        </div>
        <div>
          <h3 className="heading-4 mb-4">Data</h3>
          <p className="body-sm text-secondary">Export/import data coming soon.</p>
        </div>
      </div>
    </div>
  );
}

export default App;