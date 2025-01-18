export interface TimesheetEntryData {
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: string;
  description: string;
}

export interface TimesheetValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}