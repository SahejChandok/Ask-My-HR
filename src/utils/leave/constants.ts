// Annual Leave Entitlements
export const ANNUAL_LEAVE = {
  WEEKS_PER_YEAR: 4,           // 4 weeks minimum annual leave
  CONTINUOUS_WORK: 12,         // 12 months continuous employment required
  TAKING_LEAVE: 14,           // 14 days notice required for taking leave
  CLOSEDOWN_NOTICE: 14,       // 14 days notice required for annual closedown
  CASH_UP_LIMIT: 1,           // Can cash up up to 1 week per year
  CARRY_OVER_LIMIT: 52        // Maximum weeks to carry over
};

// Sick Leave Entitlements
export const SICK_LEAVE = {
  DAYS_PER_YEAR: 10,          // 10 days per year (as of July 2021)
  QUALIFYING_PERIOD: 6,       // 6 months continuous employment
  HOURS_PER_WEEK: 10,         // Average 10 hours per week
  CARRY_OVER_LIMIT: 10,       // Maximum days to carry over
  PROOF_REQUIRED_AFTER: 3     // Can request proof after 3 consecutive days
};

// Bereavement Leave
export const BEREAVEMENT_LEAVE = {
  IMMEDIATE_FAMILY: 3,        // 3 days for immediate family
  OTHER: 1,                   // 1 day for other bereavements
  QUALIFYING_PERIOD: 6,       // 6 months continuous employment
  HOURS_PER_WEEK: 10         // Average 10 hours per week
};

// Family Violence Leave
export const FAMILY_VIOLENCE_LEAVE = {
  DAYS_PER_YEAR: 10,         // 10 days per year
  QUALIFYING_PERIOD: 6,       // 6 months continuous employment
  PROOF_MAY_BE_REQUESTED: true
};

// Parental Leave
export const PARENTAL_LEAVE = {
  PRIMARY_CARER: 26,         // 26 weeks primary carer leave
  PARTNER: 2,                // 2 weeks partner's leave
  EXTENDED: 52,              // Up to 52 weeks extended leave
  QUALIFYING_PERIOD: 6,      // 6 months for primary carer leave
  HOURS_PER_WEEK: 10,        // Average 10 hours per week
  NOTICE_PERIOD: 3           // 3 months notice required
};

// Public Holidays
export const PUBLIC_HOLIDAYS = {
  ALTERNATIVE_HOLIDAY: true,  // Alternative holiday (day in lieu) if working
  MINIMUM_PAY: 3,            // Minimum 3 hours pay if working
  TIME_AND_HALF: 1.5,        // Time and a half for working
  TRANSFER_ALLOWED: true,    // Can transfer to another day by agreement
  MONDAYISATION: true        // Christmas/Boxing Day, New Year, ANZAC, Waitangi
};

// Leave Payment Calculations
export const LEAVE_PAYMENT = {
  GREATER_OF: {
    ORDINARY_PAY: true,      // Ordinary weekly pay at time of leave
    AVERAGE_WEEKLY: true     // Average weekly earnings over 52 weeks
  },
  INCLUDES: {
    OVERTIME: true,          // Regular overtime
    ALLOWANCES: true,        // Regular allowances
    COMMISSION: true,        // Regular commission
    BONUSES: false           // Discretionary bonuses excluded
  }
};

// Leave Request Rules
export const LEAVE_REQUEST = {
  MIN_NOTICE_DAYS: 14,       // Minimum 14 days notice for annual leave
  MAX_FUTURE_DAYS: 365,      // Can book up to 1 year in advance
  MIN_DURATION: 0.25,        // Minimum 0.25 days (2 hours)
  CANCEL_NOTICE: 7,          // 7 days notice to cancel approved leave
  APPROVAL_REQUIRED: true    // All leave requests require approval
};