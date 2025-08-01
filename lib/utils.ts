import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatCellValue(value: any): string {
  if (value == null) return "—";

  // ISO 8601 date regex (basic and not foolproof)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;

  // Check if it's an ISO date string
  if (typeof value === "string" && isoDateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // Format as: 01 Aug 2025, 06:00 PM (local time)
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

  // Try to convert to number
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    return numValue % 1 !== 0
      ? numValue.toFixed(2) // Decimal
      : numValue.toString(); // Integer
  }

  // Return non-numeric values as-is
  return value.toString();
}
