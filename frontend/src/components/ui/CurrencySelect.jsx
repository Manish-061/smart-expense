import { forwardRef } from "react";
import { CURRENCIES } from "../../lib/currencies";

export const CurrencySelect = forwardRef(function CurrencySelect({ className = "", error, ...props }, ref) {
  return (
    <div>
      <select
        ref={ref}
        className={`w-full h-11 px-3 bg-white border rounded-lg text-sm outline-none transition-colors
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary focus:border-primary'}
          ${className}`}
        {...props}
      >
        {CURRENCIES.map(c => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code} – {c.name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
