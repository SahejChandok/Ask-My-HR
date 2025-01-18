import { TimesheetEntry } from '../types';
import { STANDARD_WORK_PATTERN, isPublicHoliday } from './holidayRules';
import { calculateDailyOvertime } from './overtimeCalculations';

export function calculateHoursWorked(entry: {
  start_time: string;
  end_time: string;
  break_minutes: number;
}): number {
  if (!entry.start_time || !entry.end_time) {
    throw new Error('Invalid timesheet entry: Missing start or end time');
  }

  const startTime = new Date(`1970-01-01T${entry.start_time}`);
  const endTime = new Date(`1970-01-01T${entry.end_time}`);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid timesheet entry: Invalid time format');
  }

  // Calculate milliseconds worked
  let millisWorked = endTime.getTime() - startTime.getTime();
  if (endTime < startTime) {
    millisWorked += 24 * 60 * 60 * 1000; // Add 24 hours if end time is next day
  }
  
  // Validate break minutes
  if (entry.break_minutes < 0) {
    throw new Error('Invalid timesheet entry: Break minutes cannot be negative');
  }

  // Subtract break minutes
  millisWorked -= (entry.break_minutes || 0) * 60 * 1000;
  
  // Ensure total hours is positive
  if (millisWorked < 0) {
    throw new Error('Invalid timesheet entry: Total hours worked cannot be negative');
  }

  // Convert to hours
  return millisWorked / (1000 * 60 * 60);
}

export function calculateEntryPay(
  entry: TimesheetEntry,
  hourlyRate: number,
  dailyEntries: TimesheetEntry[]
): {
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
} {
  const hours = calculateHoursWorked(entry);
  const overtime = calculateDailyOvertime(dailyEntries, entry.date);
  const isHoliday = isPublicHoliday(entry.date);

  // Calculate pay components
  const regularPay = Math.min(hours, STANDARD_WORK_PATTERN.HOURS_PER_DAY) * hourlyRate;
  const overtimePay = (
    (overtime.overtimeHours * hourlyRate * 1.5) +
    (overtime.doubleTimeHours * hourlyRate * 2)
  );
  const holidayPay = isHoliday ? hours * hourlyRate * 0.5 : 0;

  return {
    regularPay,
    overtimePay,
    holidayPay
  };
}

export function calculateTotalHours(entries: TimesheetEntry[]): number {
  return entries.reduce((total, entry) => {
    try {
      const hours = calculateHoursWorked(entry);
      return total + hours;
    } catch (error) {
      console.error('Error calculating hours for entry:', error);
      return total;
    }
  }, 0);
}

export interface ShiftPayDetails {
  basePay: number;
  loadedPay: number;
  totalPay: number;
  rateMultiplier: number;
  allowances: Array<{
    name: string;
    amount: number;
  }>;
}

export function calculateShiftPay({
  date,
  startTime,
  endTime,
  breakMinutes,
  hourlyRate,
  shiftRules
}: {
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
  shiftRules?: TenantShiftConfig;
}): ShiftPayDetails {
  const hours = calculateHoursWorked({ start_time: startTime, end_time: endTime, break_minutes: breakMinutes });
  
  // Initialize result
  const result: ShiftPayDetails = {
    basePay: hours * hourlyRate,
    loadedPay: hours * hourlyRate,
    totalPay: hours * hourlyRate,
    rateMultiplier: 1,
    allowances: []
  };

  if (!shiftRules) {
    return result;
  }

  // Check for public holiday
  if (isPublicHoliday(date)) {
    result.rateMultiplier = shiftRules.rateMultipliers.publicHoliday.rate;
    result.loadedPay = result.basePay * result.rateMultiplier;
  }

  // Check for weekend rates
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 6) { // Saturday
    result.rateMultiplier = Math.max(result.rateMultiplier, shiftRules.rateMultipliers.weekend.saturday);
    result.loadedPay = result.basePay * result.rateMultiplier;
  } else if (dayOfWeek === 0) { // Sunday
    result.rateMultiplier = Math.max(result.rateMultiplier, shiftRules.rateMultipliers.weekend.sunday);
    result.loadedPay = result.basePay * result.rateMultiplier;
  }

  // Check for night shift
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const nightStart = new Date(`1970-01-01T${shiftRules.rateMultipliers.nightShift.startTime}`);
  const nightEnd = new Date(`1970-01-01T${shiftRules.rateMultipliers.nightShift.endTime}`);

  if (start >= nightStart || end <= nightEnd) {
    result.rateMultiplier = Math.max(result.rateMultiplier, shiftRules.rateMultipliers.nightShift.rate);
    result.loadedPay = result.basePay * result.rateMultiplier;
    
    // Add night shift allowances
    if (shiftRules.rateMultipliers.nightShift.loadingAllowance) {
      result.allowances.push({
        name: 'Night Loading',
        amount: shiftRules.rateMultipliers.nightShift.loadingAllowance
      });
    }
    if (shiftRules.rateMultipliers.nightShift.mealAllowance) {
      result.allowances.push({
        name: 'Night Meal',
        amount: shiftRules.rateMultipliers.nightShift.mealAllowance
      });
    }
  }

  // Check for meal allowance
  if (shiftRules.allowances.mealAllowance && hours >= shiftRules.allowances.mealAllowance.minimumHours) {
    result.allowances.push({
      name: 'Meal',
      amount: shiftRules.allowances.mealAllowance.amount
    });
  }

  // Calculate total including allowances
  const allowancesTotal = result.allowances.reduce((sum, a) => sum + a.amount, 0);
  result.totalPay = result.loadedPay + allowancesTotal;

  return result;
}