import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Receipt, HelpCircle, Sparkles } from "lucide-react";
import api from "../../lib/api";
import { getCategoryConfig } from "../../lib/categories";
import { formatCurrency } from "../../lib/utils";

export default function Reports() {
  const today = new Date();

  // Queries
  // 1. Current month summary
  const { data: currentSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['expenses', 'summary', today.getFullYear(), today.getMonth() + 1],
    queryFn: async () => {
      const res = await api.get(`/expenses/summary?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
      return res.data;
    },
  });

  // 2. Last 6 months expenses
  const sixMonthsAgo = subMonths(today, 5);
  const startDate = format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

  const { data: historicalExpenses, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ['expenses', 'historical', startDate, endDate],
    queryFn: async () => {
      const res = await api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`);
      return res.data;
    },
  });

  // Process data for charts
  const { trendData, projectedSavings, uncategorizedCount, totalTransactions } = useMemo(() => {
    if (!historicalExpenses || !currentSummary) {
      return { trendData: [], projectedSavings: 0, uncategorizedCount: 0, totalTransactions: 0 };
    }

    // Initialize trend data array for the last 6 months
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(today, i);
      trends.push({
        monthKey: format(d, 'yyyy-MM'),
        monthLabel: format(d, 'MMM'),
        spent: 0,
        budget: 0 // We don't have historical budget API, so we will use a mock baseline or just show spent
      });
    }

    let uncategorized = 0;

    historicalExpenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const monthKey = format(expDate, 'yyyy-MM');

      const trendEntry = trends.find(t => t.monthKey === monthKey);
      if (trendEntry) {
        trendEntry.spent += exp.amount;
      }

      if (expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear()) {
        if (exp.category === 'OTHER') {
          uncategorized++;
        }
      }
    });

    // Calculate a mock projected savings (e.g. 15% of total spend if we apply AI insights)
    const currentSpend = currentSummary.totalSpend || 0;
    const savings = currentSpend * 0.15;

    return {
      trendData: trends,
      projectedSavings: savings,
      uncategorizedCount: uncategorized,
      totalTransactions: currentSummary.transactionCount || 0
    };
  }, [historicalExpenses, currentSummary, today]);

  // Process pie chart data
  const pieData = useMemo(() => {
    if (!currentSummary?.categoryBreakdown) return [];

    const entries = Object.entries(currentSummary.categoryBreakdown)
      .map(([category, amount]) => ({
        name: getCategoryConfig(category).label,
        value: amount,
        color: getCategoryConfig(category).dot.replace('bg-', 'text-') // simple hack, better to use raw hex but Tailwind classes are hard to pass to Recharts fill.
      }))
      .sort((a, b) => b.value - a.value);

    // Recharts requires hex codes for Cell fill. We will hardcode a palette or extract from tailwind.
    // For simplicity, we use a predefined palette matching our categories.
    const COLORS = {
      "Food & Dining": "#ea580c", // orange-600
      "Transportation": "#2563eb", // blue-600
      "Shopping": "#db2777", // pink-600
      "Entertainment": "#9333ea", // purple-600
      "Health & Medical": "#dc2626", // red-600
      "Education": "#0891b2", // cyan-600
      "Bills & Utilities": "#d97706", // amber-600
      "Rent": "#059669", // emerald-600
      "Travel": "#4f46e5", // indigo-600
      "Other": "#4b5563" // gray-600
    };

    return entries.slice(0, 5).map(entry => ({
      ...entry,
      fill: COLORS[entry.name] || COLORS["Other"]
    }));
  }, [currentSummary]);

  const isLoading = isLoadingSummary || isLoadingHistorical;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive review of your spending and trends.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 text-blue-600 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Total Transactions</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{totalTransactions}</h3>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 text-orange-600 mb-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Uncategorized</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{uncategorizedCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Needs your review</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Sparkles className="w-16 h-16" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 font-medium">
                  <Sparkles className="w-4 h-4" />
                  AI Smart Insight
                </div>
                <p className="text-sm text-indigo-50 leading-relaxed font-medium">
                  Reduce "Food & Dining" cost by 12% next month to hit your overall savings goal of {formatCurrency(projectedSavings * 1.5)}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spending Trends Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Spending Trends</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="monthLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [formatCurrency(value), 'Spent']}
                    />
                    <Bar dataKey="spent" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Top 5 Categories</h3>
              {pieData.length > 0 ? (
                <div className="h-80 w-full flex flex-col items-center">
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full mt-4 space-y-2 max-h-[30%] overflow-y-auto pr-2">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                          <span className="text-gray-600 truncate max-w-[100px]">{entry.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No data for this month
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
