import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { formatCurrency } from "../../lib/utils";

const schema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  year: z.number().int().min(2020),
  month: z.number().int().min(1).max(12),
});

export function BudgetForm({ initialData, selectedYear, selectedMonth, onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: initialData?.category || "",
      amount: initialData?.budgetAmount || "",
      year: selectedYear,
      month: selectedMonth,
    },
  });

  const CATEGORIES = [
    "FOOD", "TRANSPORT", "SHOPPING", "ENTERTAINMENT",
    "HEALTH", "EDUCATION", "BILLS", "RENT", "TRAVEL", "OTHER"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Edit Budget" : "Create Budget"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              {...register("category")}
              disabled={!!initialData} // Don't allow changing category when editing
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Hidden inputs for year/month */}
          <input type="hidden" {...register("year", { valueAsNumber: true })} />
          <input type="hidden" {...register("month", { valueAsNumber: true })} />

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
