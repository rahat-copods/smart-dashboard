import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCellValue(value: any): string {
  if (value == null) return "0";

  // ISO 8601 date regex (basic and not foolproof)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;

  if (typeof value === "string" && isoDateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  // Currency detection & normalization
  if (typeof value === "string") {
    // Detect a currency pattern like "$1,234.56", "₹12,000", "EUR 1.234,56"
    const currencyLike = /^[^\d\-+]*\d[\d,.\s]*$/;
    if (currencyLike.test(value.trim())) {
      // Strip non-numeric characters except . and -
      const cleaned = value.replace(/[^\d.-]/g, "");
      const numValue = Number(cleaned);
      if (!isNaN(numValue)) {
        return numValue % 1 !== 0
          ? numValue.toFixed(2)
          : numValue.toString();
      }
    }
  }

  // Try regular number
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    return numValue % 1 !== 0
      ? numValue.toFixed(2)
      : numValue.toString();
  }

  // Return as string
  return value.toString();
}
