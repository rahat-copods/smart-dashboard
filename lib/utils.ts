import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatCellValue(value: any): string{
  // Handle null or undefined
  if (value == null) return "—";

  // Try to convert to number
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    // Check if it's a decimal number
    if (numValue % 1 !== 0) {
      // Format to 2 decimal places
      return numValue.toFixed(2);
    }
    // Return integer as-is
    return numValue.toString();
  }

  // Return non-numeric values as-is
  return value.toString();
};