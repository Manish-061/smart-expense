import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "../../lib/api";
import useAuthStore from "../../store/useAuthStore";
import { ExpenseForm } from "../../components/expense/ExpenseForm";
import { Button } from "../../components/ui/Button";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { CategorySelect } from "../../components/ui/CategorySelect";
import { getCategoryConfig } from "../../lib/categories";
import { formatCurrency } from "../../lib/utils";
import { Plus, Filter, Receipt } from "lucide-react";

export default function Expenses() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const userEmail = useAuthStore((state) => state.user?.email);
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', userEmail, categoryFilter],
    queryFn: async () => {
      const params = categoryFilter ? { category: categoryFilter } : {};
      const response = await api.get('/expenses', { params });
      return response.data;
    },
    enabled: Boolean(userEmail),
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both lists and summary to refresh data
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsFormOpen(false);
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Modal overlay for form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <ExpenseForm 
            onCancel={() => setIsFormOpen(false)}
            onSubmit={(data) => createExpenseMutation.mutate(data)}
            isLoading={createExpenseMutation.isPending}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Manage and track your transactions.</p>
        </div>
        
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="flex items-center text-sm font-medium text-gray-500">
            <Filter className="w-4 h-4 mr-2" /> Filter:
          </div>
          <CategorySelect
            showAllOption
            allLabel="All Categories"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="!h-9 max-w-[200px] text-sm"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading expenses...</div>
          ) : expenses?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses found</h3>
              <p className="text-gray-500 mb-4">You haven't recorded any expenses {categoryFilter ? 'in this category' : 'yet'}.</p>
              <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                Record your first expense
              </Button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Description</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses?.map((expense) => {
                  const catConfig = getCategoryConfig(expense.category);
                  const CatIcon = catConfig.icon;
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${catConfig.bg} flex items-center justify-center ${catConfig.color} flex-shrink-0`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900">{expense.description}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <CategoryBadge category={expense.category} size="sm" />
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
