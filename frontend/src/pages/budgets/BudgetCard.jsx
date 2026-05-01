import { Edit2, Trash2 } from "lucide-react";
import { CategoryBadge } from "../../components/ui/CategoryBadge";
import { formatCurrency } from "../../lib/utils";

export function BudgetCard({ budget, onEdit, onDelete, isDeleting }) {
  const {
    category,
    budgetAmount,
    spentAmount,
    remainingAmount,
    percentageUsed,
    status
  } = budget;

  // Determine colors based on status
  let barColor = "bg-primary";
  let statusText = "bg-primary/10 text-primary";
  let statusLabel = "On Track";

  if (status === "EXCEEDED") {
    barColor = "bg-red-500";
    statusText = "bg-red-100 text-red-700";
    statusLabel = "Exceeded";
  } else if (status === "WARNING") {
    barColor = "bg-orange-500";
    statusText = "bg-orange-100 text-orange-700";
    statusLabel = "Near Limit";
  }

  // Ensure bar doesn't overflow visually
  const clampedPercentage = Math.min(percentageUsed, 100);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <CategoryBadge category={category} />
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusText}`}>
            {statusLabel}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onEdit(budget)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Edit Budget"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(budget.id)}
              disabled={isDeleting}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete Budget"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-500">Spent</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(spentAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">of {formatCurrency(budgetAmount)}</p>
          <p className={`text-sm font-bold ${status === 'EXCEEDED' ? 'text-red-600' : 'text-gray-600'}`}>
            {status === 'EXCEEDED' ? 'Over by ' + formatCurrency(Math.abs(remainingAmount)) : formatCurrency(remainingAmount) + ' left'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
          <span>{percentageUsed}% used</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
