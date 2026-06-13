import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * Uses clsx for conditional class logic and tailwind-merge to deduplicate
 * conflicting Tailwind utility classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency string.
 * Defaults to CAD (Canadian Dollar) for Markham Office Services.
 */
export function formatCurrency(
  amount: number,
  currency: string = "CAD",
  locale: string = "en-CA"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as a compact currency string (e.g. $1.2K, $3.4M).
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = "CAD",
  locale: string = "en-CA"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Formats a date value into a human-readable string.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
  locale: string = "en-CA"
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Formats a date as a short string (e.g. "May 24, 2026").
 */
export function formatDateShort(
  date: Date | string | number,
  locale: string = "en-CA"
): string {
  return formatDate(date, { year: "numeric", month: "short", day: "numeric" }, locale);
}

/**
 * Formats a date and time (e.g. "May 24, 2026, 2:30 PM").
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = "en-CA"
): string {
  return formatDate(
    date,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
    locale
  );
}

/**
 * Returns a relative time string (e.g. "3 days ago", "in 2 hours").
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffMs = target - now;
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, "second");
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), "month");
  return rtf.format(Math.round(diffDays / 365), "year");
}

/**
 * Truncates a string to the given max length, appending an ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Converts a string to a URL-safe slug.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case.
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => capitalize(word.toLowerCase()));
}

/**
 * Generates initials from a full name (up to 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Returns a deterministic color index (0–9) from a string,
 * useful for avatar background colors.
 */
export function getColorIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 10;
}

/**
 * Checks whether a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type-safe Object.entries with proper typing.
 */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Debounces a function call by the given delay in milliseconds.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a promise that resolves after the given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the percentage of `value` relative to `total`, clamped to [0, 100].
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Strips undefined/null entries from an object (shallow).
 */
export function compact<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

/**
 * Parses a Stripe amount (integer cents) into a decimal dollar value.
 */
export function stripeAmountToDecimal(amount: number): number {
  return amount / 100;
}

/**
 * Converts a decimal dollar value to a Stripe integer amount (cents).
 */
export function decimalToStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}
