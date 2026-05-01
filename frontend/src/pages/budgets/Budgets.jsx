import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import api from "../../lib/api";
import useAuthStore from "../../store/useAuthStore";
import { ChevronLeft, ChevronRight, Plus, Target, AlertTriangle, Loader2 } from "lucide-react";
import { BudgetCard } from "./BudgetCard";
import { BudgetForm } from "./BudgetForm";
import { formatCurrency } from "../../lib/utils";

export default function Budgets() {
  const today = new Date();
  const userEmail = useAuthStore((state) => state.user?.email);
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(today);
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState(null);

  const goToPrevMonth = () => setSelectedDate((prev) => subMonths(prev, 1));
  const goToNextMonth = () => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + 1);
    setSelectedDate(next);
  };

  // Fetch Budgets
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', userEmail, selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await api.get('/budgets', {
        params: { year: selectedYear, month: selectedMonth }
      });
      return response.data;
    },
    enabled: Boolean(userEmail),
  });

  // Create/Update Budget Mutation
  const saveBudgetMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/budgets', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsFormOpen(false);
      setEditingBudget(null);
    },
  });

  // Delete Budget Mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setDeletingBudgetId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    setDeletingBudgetId(id);
  };

  const totalBudgeted = budgets?.reduce((sum, b) => sum + b.budgetAmount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spentAmount, 0) || 0;
  const totalPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Tracking</h1>
          <p className="text-gray-600 mt-1">Manage your spending limits by category.</p>
        </div>

        <div className="flex items-center gap-4">
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
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Monthly Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Budgeted</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Spent (in budgets)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Remaining Budget</p>
            <p className={`text-2xl font-bold mt-1 ${totalBudgeted - totalSpent < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span>Overall Progress</span>
            <span>{totalPercentage}% used</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                totalPercentage >= 100 ? 'bg-red-500' : totalPercentage >= 80 ? 'bg-orange-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Category Budgets</h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading budgets...</div>
        ) : !budgets || budgets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No budgets set for {format(selectedDate, "MMMM yyyy")}</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                isDeleting={deleteBudgetMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <BudgetForm
          initialData={editingBudget}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onSubmit={(data) => saveBudgetMutation.mutate(data)}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingBudget(null);
          }}
          isSubmitting={saveBudgetMutation.isPending}
        />
      )}
      {/* Delete Confirmation Modal */}
      {deletingBudgetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="flex items-start gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Budget</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete this budget? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingBudgetId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                disabled={deleteBudgetMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteBudgetMutation.mutate(deletingBudgetId)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={deleteBudgetMutation.isPending}
              >
                {deleteBudgetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
