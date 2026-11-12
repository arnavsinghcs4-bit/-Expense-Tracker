import { useState, useEffect } from 'react';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Charts } from './components/Charts';
import { BudgetPanel } from './components/BudgetPanel';
import { RecurringExpenses } from './components/RecurringExpenses';
import { Overview } from './components/Overview';
import { Layout } from './components/Layout';
import { getRecentExpenses, setBudget, generateRecurringExpenseInstances, getCurrency } from './storage';
import { format } from 'date-fns';

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

  const currency = getCurrency();

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
          onBudgetSet={(amount, curr) => setBudget(currentMonth, amount, (curr || currency) as import('./types').Currency)}
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
          <Settings />
        </div>
      )}
    </Layout>
  );
}

// Settings placeholder component
function Settings() {
  return (
    <div className="card p-8 max-w-2xl">
      <h2 className="heading-2 mb-6">Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="heading-4 mb-4">Account</h3>
          <p className="body-sm text-secondary">Account settings coming soon.</p>
        </div>
        <div>
          <h3 className="heading-4 mb-4">Preferences</h3>
          <p className="body-sm text-secondary">Preference options coming soon.</p>
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