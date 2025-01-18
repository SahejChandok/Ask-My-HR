import { TimesheetEntry } from '../../types';
import { LEAVE_PAYMENT } from './constants';

/**
 * Calculate Average Weekly Earnings (AWE) as per NZ Holidays Act 2003
 * Based on gross earnings over the last 52 weeks
 */
export function calculateAverageWeeklyEarnings(
  hourlyRate: number,
  entries: TimesheetEntry[],
  includeOvertime = true
): number {
  // Get entries from last 52 weeks
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const yearEntries = entries.filter(entry => 
    new Date(entry.date) >= yearAgo
  );

  if (yearEntries.length === 0) {
    return hourlyRate * 40; // Default to standard week if no history
  }

  // Calculate total earnings over the year
  const totalEarnings = yearEntries.reduce((sum, entry) => {
    const hours = (
      new Date(`1970-01-01T${entry.end_time}`).getTime() -
      new Date(`1970-01-01T${entry.start_time}`).getTime()
    ) / (1000 * 60 * 60);
    const workHours = hours - (entry.break_minutes || 0) / 60;

    let pay = workHours * hourlyRate;

    // Include overtime if configured
    if (includeOvertime && LEAVE_PAYMENT.INCLUDES.OVERTIME) {
      if (entry.is_overtime) {
        pay *= (entry.overtime_rate || 1.5);
      }
    }

    return sum + pay;
  }, 0);

  // Calculate weeks worked (rounded up to nearest week)
  const weeksWorked = Math.ceil(
    (new Date().getTime() - yearAgo.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  return totalEarnings / weeksWorked;
}