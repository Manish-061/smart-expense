import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import api from "../../lib/api";
import useAuthStore from "../../store/useAuthStore";
import { Wallet, Receipt, CreditCard, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { getCategoryConfig } from "../../lib/categories";
import { formatCurrency } from "../../lib/utils";

export default function Dashboard() {
  const today = new Date();
  const user = useAuthStore((state) => state.user);
  const userEmail = user?.email;
  const userFullName = user?.fullName;
  const userName = userFullName || userEmail?.split('@')[0] || 'User';

  // Month/year picker state
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1; // 1-indexed

  const currentHour = today.getHours();
  let greeting = 'Good evening';
  if (currentHour < 12) greeting = 'Good morning';
  else if (currentHour < 18) greeting = 'Good afternoon';

  const goToPrevMonth = () => setSelectedDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + 1);
    // Don't allow navigating beyond current month
    if (next <= today) setSelectedDate(next);
  };
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === (today.getMonth() + 1);

  // Fetch monthly summary (responds to selectedYear / selectedMonth)
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['expenses', userEmail, 'summary', selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await api.get('/expenses/summary', {
        params: { year: selectedYear, month: selectedMonth }
      });
      return response.data;
    },
    enabled: Boolean(userEmail),
  });

  // Fetch expenses filtered by the selected month via date range
  const { data: monthExpenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', userEmail, 'month', selectedYear, selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const response = await api.get('/expenses', { params: { startDate, endDate } });
      return response.data;
    },
    enabled: Boolean(userEmail),
  });

  // Fetch unread budget alerts
  const { data: alerts } = useQuery({
    queryKey: ['budgets', 'alerts', 'unread'],
    queryFn: async () => {
      const response = await api.get('/budgets/alerts/unread');
      return response.data;
    },
    enabled: Boolean(userEmail),
  });

  const queryClient = useQueryClient();

  const markAlertReadMutation = useMutation({
    mutationFn: async (alertId) => {
      await api.patch(`/budgets/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'alerts', 'unread'] });
    },
  });

  const markAllAlertsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/budgets/alerts/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'alerts', 'unread'] });
    },
  });

  // Derive display values
  const totalSpend = summary?.totalSpend ?? 0;
  const transactionCount = summary?.transactionCount ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {userName}</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your expenses.</p>
        </div>

        {/* Month / Year Picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[110px] text-center">
            {format(selectedDate, "MMMM yyyy")}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`p-1.5 rounded-lg transition-colors ${isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">Budget Alerts</h3>
            {alerts.length > 1 && (
              <button 
                onClick={() => markAllAlertsReadMutation.mutate()}
                disabled={markAllAlertsReadMutation.isPending}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Dismiss All
              </button>
            )}
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`flex items-start justify-between p-4 rounded-xl border ${alert.alertType === 'EXCEEDED' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.alertType === 'EXCEEDED' ? 'text-red-500' : 'text-orange-500'}`} />
                  <div>
                    <h4 className={`font-semibold text-sm ${alert.alertType === 'EXCEEDED' ? 'text-red-800' : 'text-orange-800'}`}>
                      {alert.alertType === 'EXCEEDED' ? 'Budget Exceeded' : 'Budget Warning'}
                    </h4>
                    <p className={`text-sm mt-0.5 ${alert.alertType === 'EXCEEDED' ? 'text-red-600' : 'text-orange-600'}`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => markAlertReadMutation.mutate(alert.id)}
                  disabled={markAlertReadMutation.isPending}
                  className={`p-1 rounded-md transition-colors ${alert.alertType === 'EXCEEDED' ? 'text-red-500 hover:bg-red-100' : 'text-orange-500 hover:bg-orange-100'}`}
                  title="Dismiss Alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Spending */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
              {format(selectedDate, "MMM yyyy")}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Monthly Spending</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            {isLoadingSummary ? '...' : formatCurrency(totalSpend)}
          </h2>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {format(selectedDate, "MMM yyyy")}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Transactions</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            {isLoadingSummary ? '...' : transactionCount}
          </h2>
        </div>

        {/* Card Info */}
        <div className="bg-primary p-6 rounded-2xl border border-primary-container shadow-sm text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg text-white">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
              Connected Card
            </span>
          </div>
          <p className="text-sm font-medium text-primary-fixed">Default Payment</p>
          <h2 className="text-xl font-bold mt-1">
            •••• 8291
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-lg">
              {isCurrentMonth ? 'Recent Activity' : `Activity – ${format(selectedDate, "MMMM yyyy")}`}
            </h3>
            <span className="text-sm text-gray-500">{monthExpenses?.length || 0} transactions</span>
          </div>
          <div className="p-0">
            {isLoadingExpenses ? (
              <div className="p-8 text-center text-gray-500">Loading expenses...</div>
            ) : !monthExpenses || monthExpenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No expenses recorded for {format(selectedDate, "MMMM yyyy")}.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {monthExpenses.slice(0, 10).map((expense) => {
                  const catConfig = getCategoryConfig(expense.category);
                  const CatIcon = catConfig.icon;
                  return (
                    <li key={expense.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${catConfig.bg} flex items-center justify-center ${catConfig.color}`}>
                          <CatIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{format(new Date(expense.date), "MMM d, yyyy")}</span>
                            <span className="text-gray-300">•</span>
                            <CategoryBadge category={expense.category} size="sm" showIcon={false} />
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-lg">Top Categories</h3>
          </div>
          <div className="p-6">
            {isLoadingSummary ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : !summary || Object.keys(summary.categoryBreakdown || {}).length === 0 ? (
              <div className="text-center text-gray-500 py-4">No data for {format(selectedDate, "MMM yyyy")}.</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(summary.categoryBreakdown)
                  .slice(0, 5)
                  .map(([category, amount]) => {
                    const percentage = summary.totalSpend > 0 ? (amount / summary.totalSpend) * 100 : 0;
                    const catConfig = getCategoryConfig(category);
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${catConfig.dot}`}></div>
                            <span className="text-sm font-medium text-gray-700">{catConfig.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${catConfig.dot}`}
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
