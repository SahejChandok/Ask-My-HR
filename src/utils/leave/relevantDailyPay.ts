import { TimesheetEntry } from '../../types';
import { LEAVE_PAYMENT } from './constants';

/**
 * Calculate Relevant Daily Pay (RDP) as per NZ Holidays Act 2003
 * Used for sick leave, bereavement leave, and public holidays
 */
export function calculateRelevantDailyPay(
  hourlyRate: number,
  entries: TimesheetEntry[],
  includeOvertime = true
): number {
  // Get entries from last 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentEntries = entries.filter(entry => 
    new Date(entry.date) >= fourWeeksAgo
  );

  if (recentEntries.length === 0) {
    return hourlyRate * 8; // Default to standard 8-hour day if no history
  }

  // Calculate total hours and earnings
  let totalHours = 0;
  let totalEarnings = 0;

  recentEntries.forEach(entry => {
    const hours = (
      new Date(`1970-01-01T${entry.end_time}`).getTime() -
      new Date(`1970-01-01T${entry.start_time}`).getTime()
    ) / (1000 * 60 * 60);
    const workHours = hours - (entry.break_minutes || 0) / 60;

    totalHours += workHours;
    let pay = workHours * hourlyRate;

    // Include overtime if configured
    if (includeOvertime && LEAVE_PAYMENT.INCLUDES.OVERTIME) {
      if (entry.is_overtime) {
        pay *= (entry.overtime_rate || 1.5);
      }
    }

    totalEarnings += pay;
  });

  // Calculate average daily pay
  const workDays = recentEntries.length;
  const averageDailyPay = totalEarnings / workDays;

  return averageDailyPay;
}