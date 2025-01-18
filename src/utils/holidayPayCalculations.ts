import { TimesheetEntry, EmployeeProfile } from '../types';
import { PUBLIC_HOLIDAYS } from './holidayRules';

// Constants for NZ Holiday Pay calculations
const WEEKS_PER_YEAR = 52;
const ANNUAL_LEAVE_WEEKS = 4;
const WORKING_DAYS_PER_WEEK = 5;
const HOURS_PER_DAY = 8;

/**
 * Calculate ordinary weekly pay
 * Uses the greater of:
 * 1. Average weekly earnings over the last 52 weeks
 * 2. Regular weekly pay at the time leave is taken
 */
export function calculateOrdinaryWeeklyPay(
  employee: EmployeeProfile,
  entries: TimesheetEntry[],
  periodWeeks = WEEKS_PER_YEAR
): number {
  // Calculate average weekly earnings
  const totalHours = entries.reduce((sum, entry) => {
    const hours = (
      new Date(`1970-01-01T${entry.end_time}`).getTime() -
      new Date(`1970-01-01T${entry.start_time}`).getTime()
    ) / (1000 * 60 * 60);
    return sum + (hours - (entry.break_minutes || 0) / 60);
  }, 0);

  const averageWeeklyPay = (totalHours * employee.hourly_rate) / periodWeeks;

  // Calculate regular weekly pay
  const regularWeeklyPay = employee.employment_type === 'salary'
    ? (employee.hourly_rate * 2080) / WEEKS_PER_YEAR // Annual salary divided by weeks
    : employee.hourly_rate * HOURS_PER_DAY * WORKING_DAYS_PER_WEEK;

  // Return the greater amount
  return Math.max(averageWeeklyPay, regularWeeklyPay);
}

/**
 * Calculate average daily pay
 * Used for public holiday, sick leave, and bereavement leave payments
 */
export function calculateAverageDailyPay(
  employee: EmployeeProfile,
  entries: TimesheetEntry[],
  periodWeeks = WEEKS_PER_YEAR
): number {
  const ordinaryWeeklyPay = calculateOrdinaryWeeklyPay(employee, entries, periodWeeks);
  return ordinaryWeeklyPay / WORKING_DAYS_PER_WEEK;
}

/**
 * Calculate holiday pay for annual leave
 * Based on the greater of:
 * 1. Ordinary Weekly Pay
 * 2. Average Weekly Earnings
 */
export function calculateHolidayPay(
  employee: EmployeeProfile,
  entries: TimesheetEntry[],
  days: number
): number {
  const weeklyPay = calculateOrdinaryWeeklyPay(employee, entries);
  return (weeklyPay / WORKING_DAYS_PER_WEEK) * days;
}

/**
 * Calculate payment for working on a public holiday
 * Includes:
 * 1. Time and a half for hours worked
 * 2. Alternative holiday (day in lieu) if it's an otherwise working day
 */
export function calculatePublicHolidayPay(
  employee: EmployeeProfile,
  hours: number,
  isWorkingDay: boolean
): { pay: number; alternativeHolidayEarned: boolean; minimumHours: number } {
  const timeAndHalfRate = employee.hourly_rate * 1.5;
  
  // Apply minimum hours rule for public holidays
  const minimumHours = isWorkingDay ? Math.max(hours, 3) : hours;
  const pay = minimumHours * timeAndHalfRate;

  return {
    pay,
    alternativeHolidayEarned: isWorkingDay && hours > 0,
    minimumHours
  };
}

/**
 * Calculate annual leave entitlement in hours
 */
export function calculateAnnualLeaveEntitlement(
  employee: EmployeeProfile,
  weeksEmployed: number
): number {
  // Pro-rata calculation for employees less than a year
  if (weeksEmployed < WEEKS_PER_YEAR) {
    return (ANNUAL_LEAVE_WEEKS * WORKING_DAYS_PER_WEEK * HOURS_PER_DAY * weeksEmployed) / WEEKS_PER_YEAR;
  }
  
  // Full entitlement
  return ANNUAL_LEAVE_WEEKS * WORKING_DAYS_PER_WEEK * HOURS_PER_DAY;
}

/**
 * Check if a date is an otherwise working day
 * Based on work pattern over past 4 weeks
 */
export function isOtherwiseWorkingDay(
  entries: TimesheetEntry[],
  checkDate: Date
): boolean {
  // Get entries from the last 4 weeks
  const fourWeeksAgo = new Date(checkDate);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const dayOfWeek = checkDate.getDay();
  const relevantEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= fourWeeksAgo && 
           entryDate <= checkDate &&
           entryDate.getDay() === dayOfWeek;
  });

  // If worked on this day of week in 3 out of 4 weeks, consider it a working day
  return relevantEntries.length >= 3;
}