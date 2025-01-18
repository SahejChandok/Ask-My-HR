import { PAYE_TAX_BRACKETS, SECONDARY_TAX_RATES } from './constants';

// Helper function to round to 2 decimal places
const round = (num: number) => Math.round(num * 100) / 100;

/**
 * Calculate PAYE tax for a given annual income
 */
export function calculateAnnualPAYETax(annualPay: number, taxCode: string): number {
  // Handle secondary tax codes
  if (taxCode in SECONDARY_TAX_RATES) {
    return round(annualizedPay * SECONDARY_TAX_RATES[taxCode]);
  }

  // Calculate progressive tax for primary income
  let remainingPay = annualPay;
  let totalTax = 0;
  let previousThreshold = 0;

  // Helper function to round to 2 decimal places
  const round = (num: number) => Math.round(num * 100) / 100;

  for (const bracket of PAYE_TAX_BRACKETS) {
    const taxableInBracket = Math.min(
      Math.max(0, remainingPay - previousThreshold),
      bracket.threshold - previousThreshold
    );
    
    totalTax = round(totalTax + (taxableInBracket * bracket.rate));
    remainingPay -= taxableInBracket;
    previousThreshold = bracket.threshold;

    if (remainingPay <= 0) break;
  }

  return totalTax;
}

/**
 * Calculate PAYE tax for different pay periods
 */
export function calculatePeriodPAYETax(
  periodPay: number,
  taxCode: string,
  payPeriod: 'weekly' | 'fortnightly' | 'monthly'
): number {
  const periodsPerYear = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12
  };

  const periods = periodsPerYear[payPeriod];
  const annualizedPay = periodPay * periods;
  const annualTax = calculateAnnualPAYETax(annualizedPay, taxCode);
  
  return annualTax / periods;
}