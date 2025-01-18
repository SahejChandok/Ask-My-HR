import { TimesheetEntryData, TimesheetValidationResult } from '../types/timesheet';

export function validateTimesheet(entries: TimesheetEntryData[]): TimesheetValidationResult {
  const errors: Record<string, string> = {};

  if (entries.length === 0) {
    return {
      valid: false,
      errors: {
        entries: 'At least one timesheet entry is required'
      }
    };
  }

  entries.forEach((entry, index) => {
    // Validate date
    if (!entry.date) {
      errors[`entry_${index}_date`] = 'Date is required';
    }

    // Validate times
    if (!entry.start_time) {
      errors[`entry_${index}_start_time`] = 'Start time is required';
    }
    if (!entry.end_time) {
      errors[`entry_${index}_end_time`] = 'End time is required';
    }

    // Validate break minutes
    const breakMinutes = parseInt(entry.break_minutes);
    if (isNaN(breakMinutes) || breakMinutes < 0) {
      errors[`entry_${index}_break_minutes`] = 'Break minutes must be a non-negative number';
    }

    // Validate total hours
    if (entry.start_time && entry.end_time) {
      const start = new Date(`1970-01-01T${entry.start_time}`);
      const end = new Date(`1970-01-01T${entry.end_time}`);
      let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      if (end < start) {
        hours += 24; // Add 24 hours if end time is next day
      }

      hours -= (breakMinutes || 0) / 60;

      if (hours <= 0) {
        errors[`entry_${index}_hours`] = 'Total hours must be greater than 0';
      }
      if (hours > 24) {
        errors[`entry_${index}_hours`] = 'Total hours cannot exceed 24';
      }
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}