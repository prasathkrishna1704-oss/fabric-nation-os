/**
 * Formatting utilities for the fabric store
 */

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format quantity with unit
 */
export function formatQuantity(qty: number, unit: string): string {
  const formatted = qty % 1 === 0 ? qty.toString() : qty.toFixed(2);
  const unitLabel = UNIT_LABELS[unit] || unit;
  return `${formatted} ${unitLabel}`;
}

/**
 * Format date in Indian format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Unit display labels
 */
export const UNIT_LABELS: Record<string, string> = {
  METER: "Mtr",
  KILOGRAM: "Kg",
};

/**
 * Unit options for select inputs
 */
export const UNIT_OPTIONS = [
  { value: "METER", label: "Meters (Mtr)" },
  { value: "KILOGRAM", label: "Kilograms (Kg)" },
];

/**
 * Payment method labels
 */
export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "CREDIT", label: "Credit" },
];

/**
 * Category options
 */
export const CATEGORIES = [
  "Single Jersey",
  "Slub Jersey",
  "Airtex",
  "French Terry",
  "Interlock",
  "Pique",
  "Cotton Rib 1x1",
  "Cotton Rib 2x2",
  "Lycra Rib 1x1",
  "Lycra Rib 2x2",
  "Other",
];
