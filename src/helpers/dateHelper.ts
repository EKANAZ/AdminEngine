// src/helpers/dateHelper.ts
// Helper functions for date formatting and manipulation

/**
 * Formats a Date object as YYYY-MM-DD string.
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Adds a number of days to a date and returns the new date.
 * @param date - The original date
 * @param days - Number of days to add
 * @returns New Date object
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
} 