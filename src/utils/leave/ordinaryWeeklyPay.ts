import { TimesheetEntry } from '../../types';
import { LEAVE_PAYMENT } from './constants';

/**
 * Calculate Ordinary Weekly Pay (OWP) as per NZ Holidays Act 2003
 * Uses the greater of:
 * 1. Regular weekly pay at the time leave is taken
 * 2. Average weekly earnings over the last 4 weeks
 */
export function calculateOrdinaryWeeklyPay(
  hourlyRate: number,
  entries: TimesheetEntry[],
  includeOvertime = true
): number {
  // Calculate regular weekly pay (based on standard 40-hour week)
  const regularWeeklyPay = hourlyRate * 40;

  // Get entries from last 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentEntries = entries.filter(entry => 
    new Date(entry.date) >= fourWeeksAgo
  );

  if (recentEntries.length === 0) {
    return regularWeeklyPay;
  }

  // Calculate total earnings over last 4 weeks
  const totalEarnings = recentEntries.reduce((sum, entry) => {
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

  // Calculate average weekly earnings
  const averageWeeklyEarnings = totalEarnings / 4;

  // Return greater of regular pay or average earnings
  return Math.max(regularWeeklyPay, averageWeeklyEarnings);
}