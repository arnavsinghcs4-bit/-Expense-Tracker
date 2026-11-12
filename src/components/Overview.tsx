import { useMemo } from 'react';
import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  getExpensesByMonth,
  getTotalByCategory,
  getMonthlyTotal,
  getBudget,
  getActiveRecurringExpenses
} from '../storage';
import { CATEGORIES, CATEGORY_COLORS, getCurrencyInfo, Currency, Category } from '../types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from 'date-fns';

interface OverviewProps {
  month: string;
}

export function Overview({ month }: OverviewProps) {
  const expenses = getExpensesByMonth(month);
  const categoryTotals = getTotalByCategory(month);
  const monthlyTotal = getMonthlyTotal(month);
  const budget = getBudget(month);
  const recurringExpenses = getActiveRecurringExpenses();

  // Determine display currency
  const displayCurrency: Currency = expenses[0]?.currency || 'USD';
  const currencyInfo = getCurrencyInfo(displayCurrency);
  const currencySymbol = currencyInfo.symbol;

  // KPI Calculations
  const transactionCount = expenses.length;
  const daysInMonth = new Date(parseISO(month + '-01')).getDate();
  const avgDaily = daysInMonth > 0 ? monthlyTotal / daysInMonth : 0;
  const budgetAmount = budget?.amount || 0;
  const remainingBudget = budgetAmount - monthlyTotal;
  const budgetUtilization = budgetAmount > 0 ? (monthlyTotal / budgetAmount) * 100 : 0;
  const isOverBudget = monthlyTotal > budgetAmount && budgetAmount > 0;

  // Previous month comparison
  const prevMonthDate = subMonths(parseISO(month + '-01'), 1);
  const prevMonthStr = format(prevMonthDate, 'yyyy-MM');
  const prevMonthTotal = getMonthlyTotal(prevMonthStr);
  const monthOverMonthChange = prevMonthTotal > 0
    ? ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100
    : 0;

  // Chart data
  const pieData = useMemo(() =>
    CATEGORIES
      .filter(cat => categoryTotals[cat] > 0)
      .map(cat => ({
        name: cat,
        value: categoryTotals[cat],
        color: CATEGORY_COLORS[cat],
      })), [categoryTotals]
  );

  // Daily spending for trend chart
  const start = startOfMonth(parseISO(month + '-01'));
  const end = endOfMonth(parseISO(month + '-01'));
  const days = eachDayOfInterval({ start, end });

  const dailyData = useMemo(() => days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayExpenses = expenses.filter(e => e.date.startsWith(dateStr));
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      date: format(day, 'MMM d'),
      fullDate: dateStr,
      total,
    };
  }), [expenses]);

  // 6-month trend
  const trendData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(parseISO(month + '-01'), 5 - i);
    const monthStr = format(date, 'yyyy-MM');
    const total = getMonthlyTotal(monthStr);
    return {
      month: format(date, 'MMM'),
      total,
    };
  }), [month]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() =>
    expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5), [expenses]
  );

  // Upcoming recurring expenses (next 7 days)
  const upcomingRecurring = useMemo(() =>
    recurringExpenses
      .filter(r => {
        const dueDate = parseISO(r.nextDueDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return isBefore(dueDate, weekFromNow);
      })
      .sort((a, b) => parseISO(a.nextDueDate).getTime() - parseISO(b.nextDueDate).getTime())
      .slice(0, 5), [recurringExpenses]
  );

  // Empty state
  if (expenses.length === 0 && budgetAmount === 0 && recurringExpenses.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="heading-2 mb-2">Welcome to Spendly</h2>
          <p className="body text-secondary max-w-md mx-auto">
            Start tracking your expenses to see your financial overview here.
            Add your first expense, set a budget, or create a recurring expense to get started.
          </p>
        </div>
      </div>
    );
  }

  const formatValue = (value: number) => `${currencySymbol}${value.toFixed(2)}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elevated p-3 border border-primary rounded-lg shadow-lg animate-scale-in">
          <p className="body-sm text-secondary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="body mono" style={{ color: entry.color }}>
              {entry.name}: {currencySymbol}{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Spent"
          value={formatValue(monthlyTotal)}
          icon="💸"
          trend={monthOverMonthChange !== 0 ? {
            value: Math.abs(monthOverMonthChange),
            direction: monthOverMonthChange > 0 ? 'up' : 'down',
            label: `vs ${format(prevMonthDate, 'MMM')}`
          } : undefined}
          accentColor={CATEGORY_COLORS['Bills & Utilities']}
        />
        <KPICard
          title="Budget"
          value={budgetAmount > 0 ? formatValue(budgetAmount) : 'Not set'}
          icon="🎯"
          subtitle={budgetAmount > 0 ? `${budgetUtilization.toFixed(0)}% used` : undefined}
          accentColor="var(--accent-primary)"
        />
        <KPICard
          title="Remaining"
          value={formatValue(Math.max(0, remainingBudget))}
          icon={isOverBudget ? '⚠️' : '✅'}
          variant={isOverBudget ? 'negative' : 'positive'}
          subtitle={isOverBudget ? `Over by ${formatValue(Math.abs(remainingBudget))}` : undefined}
        />
        <KPICard
          title="Transactions"
          value={transactionCount.toString()}
          icon="📝"
          subtitle={`${avgDaily.toFixed(1)} avg/day`}
        />
        <KPICard
          title="Avg Daily"
          value={formatValue(avgDaily)}
          icon="📅"
          subtitle={`${daysInMonth} days this month`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Spending Trend */}
          <Card title="Spending Trend" className="animate-slide-up stagger-1">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="var(--border-primary)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-primary)' }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={formatValue}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={CustomTooltip} labelFormatter={(label) => label} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent-primary)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 4, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 6, fill: 'var(--accent-primary)' }}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Breakdown - Pie + Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="By Category" className="animate-slide-up stagger-2">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatValue(value), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Category Breakdown" className="animate-slide-up stagger-3">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pieData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-primary)" />
                  <XAxis type="number" tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={CustomTooltip} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} minPointSize={8}>
                    {pieData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* 6 Month Trend */}
          <Card title="6 Month Trend" className="animate-slide-up stagger-4">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border-primary)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} dy={10} />
                <YAxis tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="total" fill="var(--accent-muted)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent-primary)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 4, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 6, fill: 'var(--accent-primary)' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right Column - Lists */}
        <div className="space-y-6">
          {/* Recent Transactions */}
          <Card title="Recent Transactions" className="animate-slide-up stagger-5">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="body-sm text-muted">No transactions this month</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((expense, index) => (
                  <TransactionRow
                    key={expense.id}
                    expense={expense}
                    currencySymbol={currencySymbol}
                    index={index}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Recurring */}
          {upcomingRecurring.length > 0 && (
            <Card title="Upcoming Recurring" className="animate-slide-up stagger-6">
              <div className="space-y-3">
                {upcomingRecurring.map((recurring, index) => (
                  <RecurringRow
                    key={recurring.id}
                    recurring={recurring}
                    currencySymbol={currencySymbol}
                    index={index}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Budget Progress */}
          {budgetAmount > 0 && (
            <Card title="Budget Progress" className="animate-slide-up stagger-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-secondary">Budget</span>
                    <span className="font-medium mono">{formatValue(budgetAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-secondary">Spent</span>
                    <span className="font-medium mono">{formatValue(monthlyTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-secondary">Remaining</span>
                    <span className={`font-medium mono ${isOverBudget ? 'text-negative' : 'text-positive'}`}>
                      {formatValue(Math.max(0, remainingBudget))}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverBudget ? 'bg-negative' : budgetUtilization > 80 ? 'bg-warning' : 'bg-accent-primary'
                    }`}
                    style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {isOverBudget ? 'Over budget' : `${budgetUtilization.toFixed(0)}% utilized`}
                  </span>
                  <span className="font-medium mono">
                    {formatValue(monthlyTotal)} / {formatValue(budgetAmount)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Category Detail Table */}
      {pieData.length > 0 && (
        <Card title="Category Details" className="animate-slide-up stagger-6">
          <CategoryDetailTable data={pieData} total={monthlyTotal} currencySymbol={currencySymbol} />
        </Card>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  icon,
  subtitle,
  variant,
  trend,
  accentColor
}: {
  title: string;
  value: string;
  icon: string;
  subtitle?: string;
  variant?: 'positive' | 'negative';
  trend?: { value: number; direction: 'up' | 'down'; label: string } | undefined;
  accentColor?: string;
}) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="caption text-uppercase tracking-wider text-muted mb-1">{title}</p>
          <p className="heading-2 mono truncate" style={{ color: accentColor || 'var(--text-primary)' }}>{value}</p>
          {subtitle && <p className="body-sm mt-1" style={{ color: variant === 'negative' ? 'var(--negative)' : variant === 'positive' ? 'var(--positive)' : 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary flex-shrink-0" style={{ borderColor: accentColor ? `${accentColor}40` : 'var(--border-primary)' }}>
          <span className="text-[24px]" aria-hidden="true">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`body-sm font-medium flex items-center gap-1 ${trend.direction === 'up' ? 'text-negative' : 'text-positive'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              {trend.direction === 'up' ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
            </svg>
            {trend.value.toFixed(1)}%
          </span>
          <span className="caption text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// Transaction Row
function TransactionRow({ expense, currencySymbol, index }: { expense: any; currencySymbol: string; index: number }) {
  const category = expense.category as Category;
  const color = CATEGORY_COLORS[category] || '#6b7280';

  return (
    <div className="flex items-center gap-3 py-2 border-b border-primary/50 last:border-0 animate-slide-up" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <span className="text-[14px] font-medium" style={{ color }}>{expense.category.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{expense.description}</p>
        <p className="caption text-muted capitalize">{expense.category}</p>
      </div>
      <div className="text-right">
        <p className="font-medium mono">{currencySymbol}{expense.amount.toFixed(2)}</p>
        <p className="caption text-muted">{format(parseISO(expense.date), 'MMM d')}</p>
      </div>
    </div>
  );
}

// Recurring Row
function RecurringRow({ recurring, currencySymbol, index }: { recurring: any; currencySymbol: string; index: number }) {
  const category = recurring.category as Category;
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const daysUntil = Math.ceil((parseISO(recurring.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center gap-3 py-2 border-b border-primary/50 last:border-0 animate-slide-up" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <span className="text-[14px] font-medium" style={{ color }}>{recurring.category.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{recurring.description}</p>
        <p className="caption text-muted">
          {recurring.pattern.frequency.charAt(0).toUpperCase() + recurring.pattern.frequency.slice(1)}
          {recurring.pattern.interval > 1 ? `every ${recurring.pattern.interval}` : ''} · Due in {daysUntil}d
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium mono">{currencySymbol}{recurring.amount.toFixed(2)}</p>
        <p className="caption text-muted">{format(parseISO(recurring.nextDueDate), 'MMM d')}</p>
      </div>
    </div>
  );
}

// Category Detail Table
function CategoryDetailTable({ data, total, currencySymbol }: { data: any[]; total: number; currencySymbol: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary">
            <th className="px-4 py-3 text-left caption text-uppercase tracking-wider text-muted">Category</th>
            <th className="px-4 py-3 text-right caption text-uppercase tracking-wider text-muted">Amount</th>
            <th className="px-4 py-3 text-right caption text-uppercase tracking-wider text-muted">% of Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/50">
          {data.map((item, index) => (
            <tr key={item.name} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium" style={{ backgroundColor: item.color }}>
                    {item.name.charAt(0)}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-medium mono">{currencySymbol}{item.value.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-secondary">{((item.value / total) * 100).toFixed(1)}%</td>
            </tr>
          ))}
          <tr className="border-t border-primary">
            <td className="px-4 py-3 font-semibold">Total</td>
            <td className="px-4 py-3 text-right font-semibold mono">{currencySymbol}{total.toFixed(2)}</td>
            <td className="px-4 py-3 text-right font-semibold">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Card wrapper
function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      <h3 className="heading-4 mb-5">{title}</h3>
      {children}
    </div>
  );
}