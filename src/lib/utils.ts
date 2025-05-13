import { Transaction } from "@/types/finance";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatCurrency = (amount: number): string => {
  // For extremely large numbers (999+ billion), cap at 999B+
  if (Math.abs(amount) >= 999_000_000_000) {
    return "$999B+";
  }

  // For trillion+ numbers, use T notation with 1 decimal place
  else if (Math.abs(amount) >= 1_000_000_000_000) {
    const trillions = amount / 1_000_000_000_000;
    return `$${trillions.toFixed(1)}T`;
  }

  // For billion+ numbers, use B notation with 1 decimal place
  else if (Math.abs(amount) >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    return `$${billions.toFixed(1)}B`;
  }

  // For million+ numbers, use M notation with 1 decimal place
  else if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `$${millions.toFixed(1)}M`;
  }

  // For regular numbers, use standard formatting
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const sortTransactionsByDate = (transactions: Transaction[]) => {
  return [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const formatDateWithTimezoneOffset = (dateString: string): string => {
  // Create a date object and adjust for timezone to ensure consistent display
  const date = new Date(dateString);
  // Add the timezone offset to get the correct date
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + timezoneOffset);
  return adjustedDate.toLocaleDateString();
};

/**
 * Calculates and formats the duration between a start date and the current date
 * Returns formatted string like "8 months", "1 year", "1 year and 1 month", etc.
 */
export const formatSubscriptionDuration = (startDateString: string): string => {
  if (!startDateString) return "N/A";

  // Parse the date string (format: YYYY-MM-DD)
  const [year, month, day] = startDateString
    .split("-")
    .map((num) => parseInt(num, 10));

  const startDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
  const currentDate = new Date();

  // Calculate total months between dates
  const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
  const monthDiff = currentDate.getMonth() - startDate.getMonth();

  // Total months is years * 12 + month difference
  let totalMonths = yearDiff * 12 + monthDiff;

  // Adjust for day of month (if current day is earlier than start day, subtract 1 month)
  if (currentDate.getDate() < startDate.getDate()) {
    totalMonths -= 1;
  }

  // Handle negative or zero duration (future dates or today)
  if (totalMonths <= 0) {
    return "Less than a month";
  }

  // Format the duration
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  } else if (months === 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  } else {
    return `${years} ${years === 1 ? "year" : "years"} and ${months} ${
      months === 1 ? "month" : "months"
    }`;
  }
};

/**
 * Combines multiple class names into a single string, handling conditional classes
 * and merging Tailwind CSS classes properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
