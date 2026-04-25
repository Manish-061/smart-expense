import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "../../lib/api";
import useAuthStore from "../../store/useAuthStore";
import { Wallet, Receipt, CreditCard } from "lucide-react";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { getCategoryConfig } from "../../lib/categories";

export default function Dashboard() {
  const today = new Date();
  const userEmail = useAuthStore((state) => state.user?.email);
  
  // Fetch monthly summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['expenses', userEmail, 'summary', today.getFullYear(), today.getMonth() + 1],
    queryFn: async () => {
      const response = await api.get('/expenses/summary', {
        params: { year: today.getFullYear(), month: today.getMonth() + 1 }
      });
      return response.data;
    },
    enabled: Boolean(userEmail),
  });

  // Fetch recent expenses
  const { data: recentExpenses, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['expenses', userEmail, 'recent'],
    queryFn: async () => {
      const response = await api.get('/expenses');
      return response.data.slice(0, 5); // Just take top 5 for dashboard
    },
    enabled: Boolean(userEmail),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your expenses today.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
              Active
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Monthly Spending</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            ${isLoadingSummary ? '...' : summary?.totalSpend?.toFixed(2) || '0.00'}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {format(today, "MMM yyyy")}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Transactions</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            {isLoadingRecent ? '...' : recentExpenses?.length || 0}
          </h2>
        </div>

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
            <h3 className="font-bold text-gray-900 text-lg">Recent Activity</h3>
          </div>
          <div className="p-0">
            {isLoadingRecent ? (
              <div className="p-8 text-center text-gray-500">Loading expenses...</div>
            ) : recentExpenses?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No expenses recorded yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentExpenses?.map((expense) => {
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
                        ${expense.amount.toFixed(2)}
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
              <div className="text-center text-gray-500 py-4">No data this month.</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(summary.categoryBreakdown)
                  .slice(0, 5) // Show top 5
                  .map(([category, amount]) => {
                    const percentage = (amount / summary.totalSpend) * 100;
                    const catConfig = getCategoryConfig(category);
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${catConfig.dot}`}></div>
                            <span className="text-sm font-medium text-gray-700">{catConfig.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">${amount.toFixed(2)}</span>
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
