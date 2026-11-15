import { useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area
} from 'recharts';
import {
  getExpensesByMonth,
  getTotalByCategory,
  getMonthlyTotal,
  getBudget,
  getActiveRecurringExpenses,
  getCurrency
} from '../storage';
import { CATEGORIES, CATEGORY_COLORS, getCurrencyInfo, Category } from '../types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from 'date-fns';
import {
  TrendingUp, Target, Receipt, Calendar, TrendingDown,
  DollarSign, BarChart3, ShoppingBag, Utensils, Car, Film, Home, Heart, Plane, GraduationCap, MoreHorizontal
} from 'lucide-react';

// Category icon mapping
const categoryIcons: Record<Category, React.ElementType> = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Home,
  'Healthcare': Heart,
  'Travel': Plane,
  'Education': GraduationCap,
  'Other': MoreHorizontal,
};

interface OverviewProps {
  month: string;
}

// Sparkline component
function Sparkline({ data, color = 'var(--accent-primary)', height = 32 }: { data: number[]; color?: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!svgRef.current || !pathRef.current || data.length < 2) return;

    const svg = svgRef.current;
    const path = pathRef.current;
    const width = svg.clientWidth || 120;
    const h = height;
    const padding = 4;
    const maxVal = Math.max(...data, 1);
    const minVal = Math.min(...data, 0);

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = h - padding - ((val - minVal) / (maxVal - minVal || 1)) * (h - 2 * padding);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    path.setAttribute('d', points);
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.transition = 'stroke-dashoffset 1s ease-out';
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    });
  }, [data, height]);

  if (data.length < 2) return <div className="sparkline" />;

  return (
    <svg className="sparkline" ref={svgRef} viewBox={`0 0 120 ${height}`} preserveAspectRatio="none">
      <path
        ref={pathRef}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
      />
    </svg>
  );
}

function SparklineContainer({ data, color }: { data: number[]; color?: string }) {
  return <Sparkline data={data} color={color} height={32} />;
}

export function Overview({ month }: OverviewProps) {
  const expenses = getExpensesByMonth(month);
  const categoryTotals = getTotalByCategory(month);
  const monthlyTotal = getMonthlyTotal(month);
  const budget = getBudget(month);
  const recurringExpenses = getActiveRecurringExpenses();
  const currency = getCurrency();
  const currencyInfo = getCurrencyInfo(currency);
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

  // 7-day sparkline data for each KPI
  const last7DaysBudget = dailyData.slice(-7).map(() => budgetAmount / daysInMonth || 0);
  const last7DaysTransactions = Array.from({ length: 7 }, (_, i) => {
    const date = format(subMonths(endOfMonth(parseISO(month + '-01')), 0), `yyyy-MM-${String(daysInMonth - 6 + i).padStart(2, '0')}`);
    return expenses.filter(e => e.date.startsWith(date)).length;
  });
  const last7DaysAvg = dailyData.slice(-7).map(d => d.total);
  const last7DaysSpending = dailyData.slice(-7).map(d => d.total);

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
      <div className="space-y-6 animate-page-enter">
        <div className="card-glass p-12 text-center">
          <div className="category-pill w-16 h-16 mx-auto mb-4">
            <BarChart3 className="w-8 h-8" strokeWidth={2} />
          </div>
          <h2 className="heading-1 mb-2">Welcome to Spendly</h2>
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
        <div className="glass-strong p-3 rounded-lg shadow-lg animate-scale-in">
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
    <div className="space-y-6 animate-page-enter">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Spent"
          value={formatValue(monthlyTotal)}
          icon={TrendingUp}
          sparklineData={last7DaysSpending}
          sparklineColor="var(--accent-primary)"
          trend={monthOverMonthChange !== 0 ? {
            value: Math.abs(monthOverMonthChange),
            direction: monthOverMonthChange > 0 ? 'up' : 'down',
            label: `vs ${format(prevMonthDate, 'MMM')}`
          } : undefined}
          accentColor="var(--accent-primary)"
        />
        <KPICard
          title="Budget"
          value={budgetAmount > 0 ? formatValue(budgetAmount) : 'Not set'}
          icon={Target}
          sparklineData={budgetAmount > 0 ? last7DaysBudget : []}
          sparklineColor="var(--accent-primary)"
          subtitle={budgetAmount > 0 ? `${budgetUtilization.toFixed(0)}% used` : undefined}
          accentColor="var(--accent-primary)"
        />
        <KPICard
          title="Remaining"
          value={formatValue(Math.max(0, remainingBudget))}
          icon={isOverBudget ? TrendingDown : DollarSign}
          sparklineData={last7DaysAvg}
          sparklineColor={isOverBudget ? 'var(--negative)' : 'var(--positive)'}
          variant={isOverBudget ? 'negative' : 'positive'}
          subtitle={isOverBudget ? `Over by ${formatValue(Math.abs(remainingBudget))}` : undefined}
          accentColor={isOverBudget ? 'var(--negative)' : 'var(--positive)'}
        />
        <KPICard
          title="Transactions"
          value={transactionCount.toString()}
          icon={Receipt}
          sparklineData={last7DaysTransactions}
          sparklineColor="var(--accent-primary)"
          subtitle={`${avgDaily.toFixed(1)} avg/day`}
          accentColor="var(--warning)"
        />
        <KPICard
          title="Avg Daily"
          value={formatValue(avgDaily)}
          icon={Calendar}
          sparklineData={last7DaysSpending}
          sparklineColor="var(--accent-to)"
          subtitle={`${daysInMonth} days this month`}
          accentColor="var(--accent-to)"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Spending Trend */}
          <ChartCard title="Spending Trend" className="stagger-1">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-from)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent-to)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spendingLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--accent-from)" />
                    <stop offset="100%" stopColor="var(--accent-to)" />
                  </linearGradient>
                </defs>
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
                  stroke="url(#spendingLineGradient)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 5, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 8, fill: 'var(--accent-primary)', stroke: 'var(--bg-primary)', strokeWidth: 3 }}
                  connectNulls={true}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  fill="url(#spendingGradient)"
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Category Breakdown - Pie + Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="By Category" className="stagger-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
            </ChartCard>

            <ChartCard title="Category Breakdown" className="stagger-3">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pieData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-primary)" />
                  <XAxis type="number" tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={CustomTooltip} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} minPointSize={8}>
                    {pieData.map((_entry, index) => (
                      <Cell key={`bar-${index}`} fill={`url(#barGradient${index})`} />
                    ))}
                  </Bar>
                  <defs>
                    {pieData.map((entry, index) => (
                      <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* 6 Month Trend */}
          <ChartCard title="6 Month Trend" className="stagger-4">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-from)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent-to)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--negative)" />
                    <stop offset="100%" stopColor="var(--accent-primary)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border-primary)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} dy={10} />
                <YAxis tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="total" fill="url(#trendBarGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="url(#trendLineGradient)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 5, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 8, fill: 'var(--accent-primary)', stroke: 'var(--bg-primary)', strokeWidth: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Right Column - Lists */}
        <div className="space-y-6">
          {/* Recent Transactions */}
          <CardGlass title="Recent Transactions" className="stagger-5">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="body-sm text-muted">No transactions this month</p>
              </div>
            ) : (
              <div className="space-y-2">
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
          </CardGlass>

          {/* Upcoming Recurring */}
          {upcomingRecurring.length > 0 && (
            <CardGlass title="Upcoming Recurring" className="stagger-6">
              <div className="space-y-2">
                {upcomingRecurring.map((recurring, index) => (
                  <RecurringRow
                    key={recurring.id}
                    recurring={recurring}
                    currencySymbol={currencySymbol}
                    index={index}
                  />
                ))}
              </div>
            </CardGlass>
          )}

          {/* Budget Progress */}
          {budgetAmount > 0 && (
            <CardGlass title="Budget Progress" className="stagger-6">
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
                <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      isOverBudget ? 'bg-negative' : budgetUtilization > 80 ? 'bg-warning' : 'bg-accent-gradient'
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
            </CardGlass>
          )}
        </div>
      </div>

      {/* Category Detail Table */}
      {pieData.length > 0 && (
        <CardGlass title="Category Details" className="stagger-6">
          <CategoryDetailTable data={pieData} total={monthlyTotal} currencySymbol={currencySymbol} />
        </CardGlass>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  variant,
  trend,
  accentColor,
  sparklineData,
  sparklineColor
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
  variant?: 'positive' | 'negative';
  trend?: { value: number; direction: 'up' | 'down'; label: string } | undefined;
  accentColor?: string;
  sparklineData: number[];
  sparklineColor?: string;
}) {
  return (
    <div className="kpi-card card-glass p-5 animate-slide-up card-interactive focus-ring" tabIndex={0}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="caption text-uppercase tracking-wider text-muted mb-1">{title}</p>
          <p className="heading-2 mono truncate stat-highlight" style={{ color: accentColor || 'var(--text-primary)' }}>{value}</p>
          {subtitle && <p className="body-sm mt-1" style={{ color: variant === 'negative' ? 'var(--negative)' : variant === 'positive' ? 'var(--positive)' : 'var(--text-secondary)' }}>{subtitle}</p>}
          {sparklineData.length > 0 && (
            <SparklineContainer data={sparklineData} color={sparklineColor} />
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/50 flex-shrink-0 interactive-scale" style={{ borderColor: accentColor ? `${accentColor}40` : 'var(--border-primary)' }}>
          <Icon className="w-6 h-6 interactive-scale" style={{ color: accentColor || 'var(--accent-primary)' }} aria-hidden="true" strokeWidth={2} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`body-sm font-medium flex items-center gap-1 ${trend.direction === 'up' ? 'text-negative' : 'text-positive'}`}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} /> : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
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
  const Icon = categoryIcons[category] || MoreHorizontal;

  return (
    <div className="row-interactive flex items-center gap-3 py-3 border-b border-primary/50 last:border-0 animate-slide-up focus-ring" tabIndex={0} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="category-pill relative flex-shrink-0">
        <div className="absolute inset-0 bg-accent-gradient-radial opacity-20" />
        <Icon className="w-5 h-5 relative" strokeWidth={2} />
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
  const Icon = categoryIcons[category] || MoreHorizontal;
  const daysUntil = Math.ceil((parseISO(recurring.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="row-interactive flex items-center gap-3 py-3 border-b border-primary/50 last:border-0 animate-slide-up focus-ring" tabIndex={0} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="category-pill relative flex-shrink-0">
        <div className="absolute inset-0 bg-accent-gradient-radial opacity-20" />
        <Icon className="w-5 h-5 relative" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{recurring.description}</p>
        <p className="caption text-muted">
          {recurring.pattern.frequency.charAt(0).toUpperCase() + recurring.pattern.frequency.slice(1)}
          {recurring.pattern.interval > 1 ? ` every ${recurring.pattern.interval}` : ''} · Due in {daysUntil}d
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
                  <div className="category-pill">
                    <span className="text-white font-medium">{item.name.charAt(0)}</span>
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

// Chart Card wrapper with gradient top border
function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-glass p-6 border-t-accent-gradient ${className}`}>
      <h3 className="heading-4 mb-5">{title}</h3>
      <div className="bg-secondary/30 rounded-lg p-5">
        {children}
      </div>
    </div>
  );
}

// Glass Card wrapper
function CardGlass({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-glass p-6 ${className}`}>
      <h3 className="heading-4 mb-5">{title}</h3>
      <div className="bg-secondary/30 rounded-lg p-5">
        {children}
      </div>
    </div>
  );
}
