import { TimesheetEntry } from '../types';
import { STANDARD_WORK_PATTERN } from './holidayRules';

interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
}

export function calculateDailyOvertime(
  entries: TimesheetEntry[],
  date: string
): OvertimeResult {
  // Get all entries for the given date
  const dayEntries = entries.filter(entry => entry.date === date);
  
  // Calculate total hours worked
  const totalHours = dayEntries.reduce((total, entry) => {
    const start = new Date(`1970-01-01T${entry.start_time}`);
    const end = new Date(`1970-01-01T${entry.end_time}`);
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    hours -= (entry.break_minutes || 0) / 60;
    return total + hours;
  }, 0);

  // Calculate overtime breakdowns
  const regularHours = Math.min(totalHours, STANDARD_WORK_PATTERN.HOURS_PER_DAY);
  const remainingHours = Math.max(0, totalHours - regularHours);
  const overtimeHours = Math.min(remainingHours, 4); // Up to 4 hours at 1.5x
  const doubleTimeHours = Math.max(0, remainingHours - 4); // Remaining hours at 2x

  return {
    regularHours,
    overtimeHours,
    doubleTimeHours
  };
}

export function calculateWeeklyOvertime(
  entries: TimesheetEntry[],
  weekStartDate: string
): OvertimeResult {
  // Get start and end of week
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  // Get all entries for the week
  const weekEntries = entries.filter(entry => {
    const date = new Date(entry.date);
    return date >= start && date <= end;
  });

  // Calculate total hours worked
  const totalHours = weekEntries.reduce((total, entry) => {
    const start = new Date(`1970-01-01T${entry.start_time}`);
    const end = new Date(`1970-01-01T${entry.end_time}`);
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    hours -= (entry.break_minutes || 0) / 60;
    return total + hours;
  }, 0);

  // Calculate overtime breakdowns
  const regularHours = Math.min(totalHours, STANDARD_WORK_PATTERN.HOURS_PER_DAY * STANDARD_WORK_PATTERN.DAYS_PER_WEEK);
  const remainingHours = Math.max(0, totalHours - regularHours);
  const overtimeHours = Math.min(remainingHours, 20); // Up to 20 hours at 1.5x
  const doubleTimeHours = Math.max(0, remainingHours - 20); // Remaining hours at 2x

  return {
    regularHours,
    overtimeHours,
    doubleTimeHours
  };
}