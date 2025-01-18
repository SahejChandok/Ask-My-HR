// NZ Public Holidays for 2024-2025
export const PUBLIC_HOLIDAYS_2024 = [
  { date: '2024-01-01', name: "New Year's Day" },
  { date: '2024-01-02', name: "Day after New Year's Day" },
  { date: '2024-02-06', name: 'Waitangi Day' },
  { date: '2024-03-29', name: 'Good Friday' },
  { date: '2024-04-01', name: 'Easter Monday' },
  { date: '2024-04-25', name: 'ANZAC Day' },
  { date: '2024-06-03', name: "King's Birthday" },
  { date: '2024-10-28', name: 'Labour Day' },
  { date: '2024-12-25', name: 'Christmas Day' },
  { date: '2024-12-26', name: 'Boxing Day' }
];

export const PUBLIC_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: "New Year's Day" },
  { date: '2025-01-02', name: "Day after New Year's Day" },
  { date: '2025-02-06', name: 'Waitangi Day' },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-04-21', name: 'Easter Monday' },
  { date: '2025-04-25', name: 'ANZAC Day' },
  { date: '2025-06-02', name: "King's Birthday" },
  { date: '2025-10-27', name: 'Labour Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
  { date: '2025-12-26', name: 'Boxing Day' }
];

// Combined holidays for easier lookup
export const PUBLIC_HOLIDAYS = [...PUBLIC_HOLIDAYS_2024, ...PUBLIC_HOLIDAYS_2025];

export function isPublicHoliday(date: string): boolean {
  return PUBLIC_HOLIDAYS.some(holiday => holiday.date === date);
}

// Holiday pay rates
export const HOLIDAY_PAY_RATES = {
  PUBLIC_HOLIDAY_RATE: 1.5, // Time and a half
  ALTERNATIVE_HOLIDAY: true, // Day in lieu if working on public holiday
  MINIMUM_HOURS: 3 // Minimum hours paid for working on a public holiday
};

// Leave entitlements (in weeks)
export const LEAVE_ENTITLEMENTS = {
  ANNUAL: 4,
  SICK: 2,
  BEREAVEMENT: 0.6, // 3 days
  PUBLIC_HOLIDAY: 2.2 // 11 days average
};

// Working patterns
export const STANDARD_WORK_PATTERN = {
  HOURS_PER_DAY: 8,
  DAYS_PER_WEEK: 5,
  WEEKS_PER_YEAR: 52
};

// Calculation periods
export const CALCULATION_PERIODS = {
  HOLIDAY_PAY_WEEKS: 52, // Last 52 weeks for holiday pay calculation
  AVERAGE_DAILY_PAY_WEEKS: 4, // Last 4 weeks for average daily pay (Holidays Act 2003)
  WORKING_PATTERN_WEEKS: 4, // Last 4 weeks to determine work pattern
  MINIMUM_ENTITLEMENT_WEEKS: 12 // Minimum weeks employed for leave entitlement
};