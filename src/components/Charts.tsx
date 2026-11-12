import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { getExpensesByMonth, getTotalByCategory, getMonthlyTotal } from '../storage';
import { CATEGORIES, CATEGORY_COLORS, getCurrencyInfo, Currency } from '../types';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface ChartsProps {
  month: string;
}

export function Charts({ month }: ChartsProps) {
  const expenses = getExpensesByMonth(month);
  const categoryTotals = getTotalByCategory(month);
  const monthlyTotal = getMonthlyTotal(month);

  // Determine display currency - use first expense's currency or default
  const displayCurrency: Currency = expenses[0]?.currency || 'USD';
  const currencyInfo = getCurrencyInfo(displayCurrency);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 dark:text-gray-400">No data for this month. Add expenses to see charts!</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Spent"
          value={formatValue(monthlyTotal)}
          icon="💸"
          color="blue"
        />
        <SummaryCard
          title="Transactions"
          value={expenses.length.toString()}
          icon="📝"
          color="green"
        />
        <SummaryCard
          title="Avg/Day"
          value={formatValue(monthlyTotal / new Date(parseISO(month + '-01')).getDate())}
          icon="📅"
          color="orange"
        />
      </div>

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Spending by Category">
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
                fill="#8884d8"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatValue(value), 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={formatValue} tick={{ fill: '#6b7280' }} />
              <YAxis type="category" dataKey="category" width={140} tick={{ fill: '#6b7280' }} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2: Daily Line + 6 Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Spending">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tickFormatter={formatValue} tick={{ fill: '#6b7280' }} />
              <Tooltip content={CustomTooltip} labelFormatter={(label) => label} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="6 Month Trend">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
              <YAxis tickFormatter={formatValue} tick={{ fill: '#6b7280' }} />
              <Tooltip content={CustomTooltip} />
              <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
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

function SummaryCard({ title, value, icon, color }: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`${colors[color as keyof typeof colors]} p-3 rounded-xl`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

function CategoryDetailTable({ data, total, currencySymbol }: { data: any[]; total: number; currencySymbol: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Details</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr key={item.name} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  {currencySymbol}{item.value.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                  {((item.value / total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
              <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{currencySymbol}{total.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}