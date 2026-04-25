import { getCategoryConfig } from "../../lib/categories";
import { cn } from "../../lib/utils";

/**
 * Phase 4: Color-coded category badge with icon.
 * Used in Dashboard recent activity, Expenses table, and Review page.
 */
export function CategoryBadge({ category, size = "default", showIcon = true }) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;

  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1",
    default: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        config.bg,
        config.color,
        config.border,
        sizes[size]
      )}
    >
      {showIcon && <Icon className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      {config.label}
    </span>
  );
}
