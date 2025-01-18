import { addDays, isSaturday, isSunday } from 'date-fns';

/**
 * Handle Mondayisation of public holidays as per NZ Holidays Act
 */
export function getMondayisedDate(date: string): string {
  const holidayDate = new Date(date);
  
  // Holidays that are Mondayised when falling on weekend:
  // - Christmas Day (25 Dec)
  // - Boxing Day (26 Dec)
  // - New Year's Day (1 Jan)
  // - Day after New Year's Day (2 Jan)
  // - Waitangi Day (6 Feb)
  // - ANZAC Day (25 Apr)
  
  const mondayisedHolidays = [
    { month: 12, day: 25 }, // Christmas
    { month: 12, day: 26 }, // Boxing Day
    { month: 1, day: 1 },   // New Year's
    { month: 1, day: 2 },   // Day after New Year's
    { month: 2, day: 6 },   // Waitangi Day
    { month: 4, day: 25 }   // ANZAC Day
  ];

  const isHolidayMondayised = mondayisedHolidays.some(h => 
    h.month === holidayDate.getMonth() + 1 && 
    h.day === holidayDate.getDate()
  );

  if (!isHolidayMondayised) {
    return date; // Return original date if not a Mondayised holiday
  }

  if (isSaturday(holidayDate)) {
    // Move to following Monday
    return addDays(holidayDate, 2).toISOString().split('T')[0];
  }

  if (isSunday(holidayDate)) {
    // Move to following Tuesday if it's Boxing Day and Christmas was on Saturday
    // Otherwise move to following Monday
    if (holidayDate.getMonth() === 11 && holidayDate.getDate() === 26) {
      const christmasDate = addDays(holidayDate, -1);
      if (isSaturday(christmasDate)) {
        return addDays(holidayDate, 2).toISOString().split('T')[0];
      }
    }
    return addDays(holidayDate, 1).toISOString().split('T')[0];
  }

  return date; // Return original date if not on weekend
}