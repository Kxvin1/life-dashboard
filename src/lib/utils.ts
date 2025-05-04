import { Transaction } from "@/types/finance";

export const formatCurrency = (amount: number): string => {
  // For very large numbers, use compact notation
  if (Math.abs(amount) >= 1000000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
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
