// 2024-2025 PAYE Tax Rates
export const PAYE_TAX_BRACKETS = [
  { threshold: 14000, rate: 0.105 },  // 10.5% up to $14,000
  { threshold: 48000, rate: 0.175 },  // 17.5% from $14,001 to $48,000
  { threshold: 70000, rate: 0.30 },   // 30% from $48,001 to $70,000
  { threshold: 180000, rate: 0.33 },  // 33% from $70,001 to $180,000
  { threshold: Infinity, rate: 0.39 }, // 39% over $180,000
];

// Secondary Tax Codes and Rates
export const SECONDARY_TAX_RATES: Record<string, number> = {
  'SB': 0.105,  // Secondary income up to $14,000
  'S': 0.175,   // Secondary income $14,001-$48,000
  'SH': 0.30,   // Secondary income $48,001-$70,000
  'ST': 0.33,   // Secondary income $70,001-$180,000
  'SA': 0.39    // Secondary income over $180,000
};

// KiwiSaver Constants
export const KIWISAVER = {
  EMPLOYER_RATE: 0.03,      // 3% minimum employer contribution
  MIN_EMPLOYEE_RATE: 0.03,  // 3% minimum employee contribution
  MAX_EMPLOYEE_RATE: 0.10,  // 10% maximum employee contribution
  COMPULSORY_WAIT: 90,      // 90 day wait period for new employees
  OPT_OUT_WINDOW: 56        // 56 days (8 weeks) to opt out
};

// ACC Levy Rates 2024/2025
export const ACC = {
  EARNERS_LEVY: 0.0139,    // 1.39% earners' levy
  MAX_EARNINGS: 139384,    // Maximum earnings threshold
  MIN_EARNINGS: 0,         // No minimum threshold
  LEVY_YEAR_START: '2024-04-01',
  LEVY_YEAR_END: '2025-03-31'
};

// Minimum Wage Rates (as of April 1, 2024)
export const MINIMUM_WAGE = {
  ADULT: 23.15,           // Adult rate (18 years and over)
  STARTING_OUT: 18.52,    // Starting-out rate (16-17 years, first 6 months)
  TRAINING: 18.52         // Training rate (for recognized supervision)
};