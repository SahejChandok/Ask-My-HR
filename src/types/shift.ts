import { Role } from './index';

// Shift Types
export type ShiftType = 
  | 'regular'      // Standard work hours
  | 'overtime'     // Extra hours beyond standard
  | 'night'        // Night shift hours
  | 'weekend'      // Weekend work
  | 'public_holiday' // Public holiday work
  | 'on_call'      // On-call shifts
  | 'standby'      // Standby duty
  | 'split'        // Split shifts
  | 'rotating'     // Rotating roster shifts
  | 'flexible';    // Flexible hours

// Time Rules
export interface TimeRules {
  standardHours: {
    daily: number;     // e.g., 8 hours
    weekly: number;    // e.g., 40 hours
    monthly?: number;  // Optional monthly limit
    fortnightly?: number;
  };
  breakRules: {
    minimumBreak: number;      // e.g., 30 minutes
    paidBreak: boolean;        // Whether breaks are paid
    breakFrequency: number;    // e.g., 1 break per 4 hours
    maxWorkBeforeBreak: number;// e.g., 5 hours max before break required
    additionalBreaks?: Array<{
      hours: number;
      duration: number;
      paid: boolean;
    }>;
  };
  overtimeThresholds: {
    daily?: number;    // e.g., over 8 hours
    weekly?: number;   // e.g., over 40 hours
    fortnightly?: number; // e.g., over 80 hours
  };
}

// Rate Multipliers
export interface RateMultipliers {
  overtime: {
    rate1: number;     // e.g., 1.5x for first 4 hours
    rate2: number;     // e.g., 2x for additional hours
    threshold: number; // Hours before rate2 applies
  };
  weekend: {
    saturday: number;  // e.g., 1.25x
    sunday: number;    // e.g., 1.5x
  };
  publicHoliday: {
    rate: number;      // e.g., 2x
    alternativeHoliday: boolean; // Whether day in lieu is given
  };
  nightShift: {
    rate: number;      // e.g., 1.15x
    startTime: string; // e.g., "22:00"
    endTime: string;   // e.g., "06:00"
    loadingAllowance?: number;
    mealAllowance?: number;
  };
  regionalHolidays?: {
    auckland?: {
      anniversaryDay: boolean;
      waitangiDay: boolean;
    };
    wellington?: {
      anniversaryDay: boolean;
    };
  };
  specialRates?: {
    onCall: number;
    emergencyCallout: number;
    trainingDays: number;
  };
}

// Allowances
export interface ShiftAllowances {
  mealAllowance?: {
    amount: number;
    minimumHours: number;  // e.g., 8 hours to qualify
  };
  transportAllowance?: {
    amount: number;
    applicableShifts: ShiftType[];
  };
  locationAllowance?: {
    amount: number;
    locations: string[];
  };
  toolAllowance?: number;
  qualificationAllowance?: number;
}

// Roster Rules
export interface RosterRules {
  minimumRestPeriod: number;    // Hours between shifts
  maximumConsecutiveDays: number;
  maximumWeeklyHours: number;
  noticeRequired: number;       // Hours notice for roster changes
  preferredDaysOff: string[];   // e.g., ['Saturday', 'Sunday']
  rotationPattern?: {
    weeks: number;              // Length of rotation
    pattern: ShiftType[];       // Sequence of shifts
  };
}

// Tenant-Level Configuration
export interface TenantShiftConfig {
  id: string;
  tenant_id: string;
  name: string;
  location?: string;
  timeRules: TimeRules;
  rateMultipliers: RateMultipliers;
  allowances: ShiftAllowances;
  rosterRules: RosterRules;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Employee-Level Overrides
export interface EmployeeShiftOverrides {
  id: string;
  employee_id: string;
  standardHours?: Partial<TimeRules['standardHours']>;
  rateMultipliers?: Partial<RateMultipliers>;
  allowances?: Partial<ShiftAllowances>;
  restrictions?: {
    maxHours?: number;
    excludedShifts?: ShiftType[];
    requiredBreaks?: number[];
  };
}

// Validation Rules
export interface ValidationRules {
  minimumShiftLength: number;   // e.g., 3 hours
  maximumShiftLength: number;   // e.g., 12 hours
  breakValidation: {
    required: boolean;
    minimumLength: number;
    maximumLength: number;
  };
  overlappingShifts: boolean;   // Whether to allow overlapping shifts
  futureShifts: {
    allowed: boolean;
    maxDays: number;
  };
  pastShifts: {
    allowed: boolean;
    maxDays: number;
  };
}

// Shift Entry
export interface ShiftEntry {
  id: string;
  employee_id: string;
  shift_type: ShiftType;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  location?: string;
  notes?: string;
  allowances: string[];
  rate_multiplier: number;
  created_at: string;
  updated_at: string;
}

// Access Control
export interface ShiftAccess {
  roles: Role[];
  actions: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
  };
}