export interface PublicHoliday {
  date: string;
  name: string;
}

export interface HolidayPayRate {
  rate: number;
  description: string;
}

export interface HolidayPayCalculation {
  baseRate: number;
  multiplier: number;
  hours: number;
  total: number;
  alternativeHolidayEarned?: boolean;
}

export interface OvertimeRule {
  dailyHours: number;
  weeklyHours: number;
  overtimeRate: number;
  doubleTimeRate: number;
}