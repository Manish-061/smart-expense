import { 
  Utensils, Car, ShoppingBag, Film, Heart, GraduationCap, 
  FileText, Home, Plane, HelpCircle 
} from "lucide-react";

/**
 * Phase 4: Shared category configuration.
 * Single source of truth for category metadata — colors, icons, and labels.
 */
export const CATEGORIES = [
  "FOOD", "TRANSPORT", "SHOPPING", "ENTERTAINMENT",
  "HEALTH", "EDUCATION", "BILLS", "RENT", "TRAVEL", "OTHER"
];

export const CATEGORY_CONFIG = {
  FOOD: {
    label: "Food & Dining",
    icon: Utensils,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  TRANSPORT: {
    label: "Transportation",
    icon: Car,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  SHOPPING: {
    label: "Shopping",
    icon: ShoppingBag,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    dot: "bg-pink-500",
  },
  ENTERTAINMENT: {
    label: "Entertainment",
    icon: Film,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  HEALTH: {
    label: "Health & Medical",
    icon: Heart,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  EDUCATION: {
    label: "Education",
    icon: GraduationCap,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
  },
  BILLS: {
    label: "Bills & Utilities",
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  RENT: {
    label: "Rent",
    icon: Home,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  TRAVEL: {
    label: "Travel",
    icon: Plane,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  OTHER: {
    label: "Other",
    icon: HelpCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
};

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;
}
