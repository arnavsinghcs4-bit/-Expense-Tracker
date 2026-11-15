import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area
} from 'recharts';
import { getExpensesByMonth, getTotalByCategory, getMonthlyTotal, getCurrency } from '../storage';
import { CATEGORIES, CATEGORY_COLORS, getCurrencyInfo, Category } from '../types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useRef, useEffect } from 'react';
import {
  CreditCard, Receipt, Calendar, BarChart3,
  Utensils, Car, ShoppingBag, Film, Home, Heart, Plane, GraduationCap, MoreHorizontal
} from 'lucide-react';

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

interface ChartsProps {
  month: string;
}

export function Charts({ month }: ChartsProps) {
  const expenses = getExpensesByMonth(month);
  const categoryTotals = getTotalByCategory(month);
  const monthlyTotal = getMonthlyTotal(month);
  const currency = getCurrency();
  const currencyInfo = getCurrencyInfo(currency);
  const currencySymbol = currencyInfo.symbol;

  // Prepare data for category pie chart
  const pieData = CATEGORIES
    .filter(cat => categoryTotals[cat] > 0)
    .map(cat => ({
      name: cat,
      value: categoryTotals[cat],
      color: CATEGORY_COLORS[cat],
    }));

  // Prepare data for daily spending line chart
  const start = startOfMonth(parseISO(month + '-01'));
  const end = endOfMonth(parseISO(month + '-01'));
  const days = eachDayOfInterval({ start, end });

  const dailyData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayExpenses = expenses.filter(e => e.date.startsWith(dateStr));
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      date: format(day, 'MMM d'),
      fullDate: dateStr,
      total,
    };
  });

  // Prepare data for category bar chart
  const barData = CATEGORIES
    .filter(cat => categoryTotals[cat] > 0)
    .map(cat => ({
      category: cat,
      amount: categoryTotals[cat],
      color: CATEGORY_COLORS[cat],
    }));

  // Last 6 months trend
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(parseISO(month + '-01'), 5 - i);
    const monthStr = format(date, 'yyyy-MM');
    const total = getMonthlyTotal(monthStr);
    return {
      month: format(date, 'MMM'),
      total,
    };
  });

  if (expenses.length === 0) {
    return (
      <div className="card-glass p-12 text-center animate-page-enter">
        <div className="category-pill w-16 h-16 mx-auto mb-4">
          <BarChart3 className="w-8 h-8" strokeWidth={2} />
        </div>
        <h3 className="heading-2 mb-2">No data for this month</h3>
        <p className="body text-secondary max-w-md mx-auto">
          Add expenses to see your spending analytics and charts.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong p-3 rounded-lg shadow-lg animate-scale-in focus-ring" tabIndex={0}>
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

  const formatValue = (value: number) => `${currencySymbol}${value.toFixed(2)}`;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Spent"
          value={formatValue(monthlyTotal)}
          icon={CreditCard}
          accentColor="var(--accent-primary)"
          sparklineData={dailyData.slice(-7).map(d => d.total)}
          sparklineColor="var(--accent-primary)"
        />
        <KPICard
          title="Transactions"
          value={expenses.length.toString()}
          icon={Receipt}
          accentColor="var(--positive)"
          sparklineData={Array.from({ length: 7 }, (_, i) => {
            const date = format(subMonths(end, 6 - i), 'yyyy-MM-dd');
            return expenses.filter(e => e.date.startsWith(date)).length;
          })}
          sparklineColor="var(--positive)"
        />
        <KPICard
          title="Avg / Day"
          value={formatValue(monthlyTotal / new Date(parseISO(month + '-01')).getDate())}
          icon={Calendar}
          accentColor="var(--warning)"
          sparklineData={dailyData.slice(-7).map(d => d.total)}
          sparklineColor="var(--warning)"
        />
      </div>

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Spending by Category" className="stagger-1">
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

        <ChartCard title="Category Breakdown" className="stagger-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-primary)" />
              <XAxis type="number" tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]} minPointSize={8}>
                {barData.map((_entry, index) => (
                  <Cell key={`bar-${index}`} fill={`url(#barGradient${index})`} />
                ))}
              </Bar>
              <defs>
                {barData.map((entry, index) => (
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

      {/* Charts Row 2: Daily Line + 6 Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Spending" className="stagger-3">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-from)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent-to)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dailyLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent-from)" />
                  <stop offset="100%" stopColor="var(--accent-to)" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="4 4" stroke="var(--border-primary)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border-primary)' }} dy={10} />
              <YAxis tickFormatter={formatValue} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={CustomTooltip} labelFormatter={(label) => label} />
              <Area
                type="monotone"
                dataKey="total"
                fill="url(#dailyGradient)"
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="url(#dailyLineGradient)"
                strokeWidth={3}
                dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 5, stroke: 'var(--bg-primary)' }}
                activeDot={{ r: 8, fill: 'var(--accent-primary)', stroke: 'var(--bg-primary)', strokeWidth: 3 }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="6 Month Trend" className="stagger-4">
          <ResponsiveContainer width="100%" height={300}>
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

      {/* Category Detail Table */}
      <CategoryDetailTable data={pieData} total={monthlyTotal} currencySymbol={currencySymbol} />
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  accentColor,
  sparklineData,
  sparklineColor
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accentColor: string;
  sparklineData: number[];
  sparklineColor: string;
}) {
  return (
    <div className="kpi-card card-glass p-5 animate-slide-up card-interactive focus-ring" tabIndex={0}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="caption text-uppercase tracking-wider text-muted mb-1">{title}</p>
          <p className="heading-2 mono truncate stat-highlight" style={{ color: accentColor }}>{value}</p>
          {sparklineData.length > 0 && (
            <Sparkline data={sparklineData} color={sparklineColor} height={28} />
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/50 flex-shrink-0 interactive-scale" style={{ borderColor: `${accentColor}40` }}>
          <Icon className="w-6 h-6 interactive-scale" style={{ color: accentColor }} aria-hidden="true" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

// Simple Sparkline for KPI cards
function Sparkline({ data, color = 'var(--accent-primary)', height = 28 }: { data: number[]; color?: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!svgRef.current || !pathRef.current || data.length < 2) return;

    const svg = svgRef.current;
    const path = pathRef.current;
    const width = svg.clientWidth || 100;
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
    path.style.transition = 'stroke-dashoffset 800ms ease-out';
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    });
  }, [data, height]);

  if (data.length < 2) return <div className="sparkline" style={{ height }} />;

  return (
    <svg className="sparkline" ref={svgRef} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <path
        ref={pathRef}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
      />
    </svg>
  );
}


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

function CategoryDetailTable({ data, total, currencySymbol }: { data: any[]; total: number; currencySymbol: string }) {
  return (
    <div className="card-glass p-6 stagger-5">
      <h3 className="heading-4 mb-5">Category Details</h3>
      <div className="bg-secondary/30 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/30">
                <th className="px-6 py-4 text-left caption text-uppercase tracking-wider text-muted">Category</th>
                <th className="px-6 py-4 text-right caption text-uppercase tracking-wider text-muted">Amount</th>
                <th className="px-6 py-4 text-right caption text-uppercase tracking-wider text-muted">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/30">
              {data.map((item, index) => {
                const Icon = categoryIcons[item.name as Category] || MoreHorizontal;
                return (
                  <tr key={item.name} className="row-interactive animate-slide-up focus-ring" tabIndex={0} style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="category-pill" style={{ backgroundColor: item.color + '20' }}>
                          <Icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <span className="font-medium text-primary">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium mono text-primary">{currencySymbol}{item.value.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-secondary">{((item.value / total) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr className="border-t border-primary/30 bg-secondary/20">
                <td className="px-6 py-4 font-semibold text-primary">Total</td>
                <td className="px-6 py-4 text-right font-semibold mono text-primary">{currencySymbol}{total.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-semibold text-primary">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}