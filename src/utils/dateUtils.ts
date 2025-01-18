import { format, parse, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { PayPeriodType } from '../types';

function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// Format for API (ISO format: yyyy-MM-dd)
export function formatAPIDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(d)) {
    console.warn('Invalid date:', date);
    return '';
  }
  return format(d, 'yyyy-MM-dd');
}

// Format for display (NZ format: dd/MM/yyyy)
export function formatDisplayDate(date: string | Date | null | undefined): string {
  if (!date || date === 'Invalid date') {
    console.warn('Invalid date:', date);
    return 'Invalid date';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(dateObj)) {
    console.warn('Invalid date:', date);
    return 'Invalid date';
  }
  
  try {
    return format(dateObj, 'dd/MM/yyyy');
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Invalid date';
  }
}

// Parse NZ formatted date to Date object
export function parseNZDate(dateStr: string): Date {
  // If already in ISO format, parse directly
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr);
  }
  // Otherwise parse as NZ format
  return parse(dateStr, 'dd/MM/yyyy', new Date());
}

export function calculatePeriodEndDate(startDate: Date, periodType: PayPeriodType): Date {
  const end = new Date(startDate);
  
  end.setHours(0, 0, 0, 0);
  
  switch (periodType) {
    case 'weekly':
      // Add 6 days to include full week
      end.setDate(end.getDate() + 6);
      break;
    case 'fortnightly':
      // Add 13 days to include full fortnight
      end.setDate(end.getDate() + 13);
      break;
    case 'monthly':
      // Move to last day of current month
      end.setMonth(end.getMonth() + 1, 0);
      break;
  }
  
  // Ensure end date is set to end of day
  end.setHours(23, 59, 59, 999);
  
  return end;
}

export function getCurrentPayPeriod(periodType: PayPeriodType): {
  start: string;
  end: string;
} {
  const today = new Date();
  let start = startOfMonth(today);
  let end;

  switch (periodType) {
    case 'weekly':
      // Start from Monday of current week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(start.setDate(diff));
      end = addDays(start, 6);
      break;
    case 'fortnightly':
      // Start from Monday of current fortnight
      const firstMonday = new Date(start.setDate(1));
      while (firstMonday.getDay() !== 1) {
        firstMonday.setDate(firstMonday.getDate() + 1);
      }
      start = firstMonday;
      end = addDays(start, 13);
      break;
    case 'monthly':
    default:
      // Use calendar month
      end = endOfMonth(today);
  }

  return {
    start: formatAPIDate(start),
    end: formatAPIDate(end)
  };
}