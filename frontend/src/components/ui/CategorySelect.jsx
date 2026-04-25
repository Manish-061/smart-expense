import { forwardRef } from "react";
import { CATEGORIES, getCategoryConfig } from "../../lib/categories";
import { cn } from "../../lib/utils";

/**
 * Phase 4: Styled category dropdown selector.
 * Used in ExpenseForm, Review page, and Expenses filter bar.
 */
export const CategorySelect = forwardRef(function CategorySelect(
  { error, className, showAllOption = false, allLabel = "All Categories", ...props },
  ref
) {
  return (
    <div>
      <select
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer",
          error ? "border-red-300 focus:ring-red-400" : "border-gray-300",
          className
        )}
        {...props}
      >
        {showAllOption ? (
          <option value="">{allLabel}</option>
        ) : (
          <option value="">Select a category</option>
        )}
        {CATEGORIES.map((cat) => {
          const config = getCategoryConfig(cat);
          return (
            <option key={cat} value={cat}>
              {config.label}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});
