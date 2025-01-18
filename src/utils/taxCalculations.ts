import { EmployeeProfile } from '../types';

// 2024 PAYE Tax Rates
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

/**
 * Calculate PAYE tax for a given income amount
 * @param annualizedPay The annualized pay amount
 * @param taxCode The employee's tax code
 * @returns The calculated PAYE tax
 */
export function calculatePAYETax(annualizedPay: number, taxCode: string): number {
  // Handle secondary tax codes
  if (taxCode in SECONDARY_TAX_RATES) {
    return annualizedPay * SECONDARY_TAX_RATES[taxCode];
  }

  // Calculate progressive tax for primary income
  let remainingPay = annualizedPay;
  let totalTax = 0;
  let previousThreshold = 0;

  for (const bracket of PAYE_TAX_BRACKETS) {
    const taxableInBracket = Math.min(
      Math.max(0, remainingPay - previousThreshold),
      bracket.threshold - previousThreshold
    );
    
    totalTax += taxableInBracket * bracket.rate;
    remainingPay -= taxableInBracket;
    previousThreshold = bracket.threshold;

    if (remainingPay <= 0) break;
  }

  return totalTax;
}

/**
 * Calculate weekly PAYE tax
 * @param weeklyPay The weekly pay amount
 * @param taxCode The employee's tax code
 * @returns The calculated weekly PAYE tax
 */
export function calculateWeeklyPAYETax(weeklyPay: number, taxCode: string): number {
  const annualizedPay = weeklyPay * 52;
  const annualTax = calculatePAYETax(annualizedPay, taxCode);
  return annualTax / 52;
}

/**
 * Calculate fortnightly PAYE tax
 * @param fortnightlyPay The fortnightly pay amount
 * @param taxCode The employee's tax code
 * @returns The calculated fortnightly PAYE tax
 */
export function calculateFortnightlyPAYETax(fortnightlyPay: number, taxCode: string): number {
  const annualizedPay = fortnightlyPay * 26;
  const annualTax = calculatePAYETax(annualizedPay, taxCode);
  return annualTax / 26;
}

/**
 * Calculate monthly PAYE tax
 * @param monthlyPay The monthly pay amount
 * @param taxCode The employee's tax code
 * @returns The calculated monthly PAYE tax
 */
export function calculateMonthlyPAYETax(monthlyPay: number, taxCode: string): number {
  const annualizedPay = monthlyPay * 12;
  const annualTax = calculatePAYETax(annualizedPay, taxCode);
  return annualTax / 12;
}

/**
 * Calculate total deductions including PAYE and KiwiSaver
 * @param grossPay The gross pay amount
 * @param employee The employee profile
 * @param payPeriod The pay period type ('weekly' | 'fortnightly' | 'monthly')
 * @returns The calculated deductions
 */
export function calculateDeductions(
  grossPay: number,
  employee: EmployeeProfile,
  payPeriod: 'weekly' | 'fortnightly' | 'monthly'
): {
  payeTax: number;
  kiwiSaverDeduction: number;
  employerKiwiSaver: number;
  netPay: number;
} {
  // Calculate PAYE tax based on pay period
  let payeTax: number;
  switch (payPeriod) {
    case 'weekly':
      payeTax = calculateWeeklyPAYETax(grossPay, employee.tax_code);
      break;
    case 'fortnightly':
      payeTax = calculateFortnightlyPAYETax(grossPay, employee.tax_code);
      break;
    case 'monthly':
      payeTax = calculateMonthlyPAYETax(grossPay, employee.tax_code);
      break;
  }

  // Calculate KiwiSaver
  const kiwiSaverDeduction = employee.kiwisaver_enrolled
    ? grossPay * (employee.kiwisaver_rate / 100)
    : 0;

  const employerKiwiSaver = employee.kiwisaver_enrolled
    ? grossPay * 0.03 // 3% employer contribution
    : 0;

  // Calculate net pay
  const netPay = grossPay - payeTax - kiwiSaverDeduction;

  return {
    payeTax,
    kiwiSaverDeduction,
    employerKiwiSaver,
    netPay
  };
}