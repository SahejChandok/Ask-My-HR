import { TimesheetEntry } from '../../types';
import { PUBLIC_HOLIDAYS } from '../holidayRules';

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

/**
 * Calculate alternative holiday entitlement
 */
export function calculateAlternativeHoliday(
  entries: TimesheetEntry[],
  date: string
): {
  entitled: boolean;
  reason: string;
} {
  // Check if it's a public holiday
  const isHoliday = PUBLIC_HOLIDAYS.some(holiday => holiday.date === date);
  if (!isHoliday) {
    return {
      entitled: false,
      reason: 'Not a public holiday'
    };
  }

  // Check if any hours were worked
  const dayEntries = entries.filter(entry => entry.date === date);
  if (dayEntries.length === 0) {
    return {
      entitled: false,
      reason: 'No hours worked on this public holiday'
    };
  }

  // Check if it would otherwise be a working day
  const checkDate = new Date(date);
  const wouldWork = isOtherwiseWorkingDay(entries, checkDate);

  return {
    entitled: wouldWork,
    reason: wouldWork ? 
      'Worked on a public holiday that would otherwise be a working day' :
      'Not an otherwise working day'
  };
}