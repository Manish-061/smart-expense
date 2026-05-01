import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatAmount } from "./currencies"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats an amount as INR currency.
 */
export function formatCurrency(amount) {
  return formatAmount(amount);
}
