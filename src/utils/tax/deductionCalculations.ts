import { EmployeeProfile } from '../../types';
import { calculatePeriodPAYETax } from './payeCalculations';
import { calculateKiwiSaverDeductions } from './kiwiSaverCalculations';
import { calculateACCLevyWithYTD } from './accCalculations';
import { MINIMUM_WAGE } from './constants';

// Helper function to round to 2 decimal places
const round = (num: number) => Math.round(num * 100) / 100;

/**
 * Calculate all deductions for a pay period
 */
export function calculateDeductions(
  grossPay: number,
  employee: EmployeeProfile,
  payPeriod: 'weekly' | 'fortnightly' | 'monthly',
  ytdEarnings = 0
): {
  payeTax: number;
  kiwiSaverDeduction: number;
  employerKiwiSaver: number;
  accLevy: number;
  accLevyDetails?: {
    ytdEarnings: number;
    remainingCap: number;
  };
  netPay: number;
  minimumWageCheck: {
    compliant: boolean;
    requiredRate: number;
    actualRate: number;
  };
} {
  // Validate minimum wage compliance
  const hoursPerPeriod = {
    weekly: 40,
    fortnightly: 80,
    monthly: 173.33 // Average monthly hours (40 * 52 / 12)
  };

  const effectiveHourlyRate = round(grossPay / hoursPerPeriod[payPeriod]);
  const requiredRate = employee.employment_type === 'training' ? 
    MINIMUM_WAGE.TRAINING : MINIMUM_WAGE.ADULT;

  const minimumWageCheck = {
    compliant: effectiveHourlyRate >= requiredRate,
    requiredRate,
    actualRate: effectiveHourlyRate
  };

  // Calculate PAYE tax
  const payeTax = calculatePeriodPAYETax(grossPay, employee.tax_code, payPeriod);

  // Calculate ACC levy with YTD tracking
  const accCalc = calculateACCLevyWithYTD(grossPay, ytdEarnings, payPeriod);

  // Calculate KiwiSaver
  const kiwiSaver = calculateKiwiSaverDeductions(grossPay, employee.kiwisaver_rate, employee.kiwisaver_enrolled);

  // Calculate net pay
  const netPay = round(grossPay - payeTax - kiwiSaver.employeeDeduction - accCalc.levy);

  return {
    payeTax,
    kiwiSaverDeduction: kiwiSaver.employeeDeduction,
    employerKiwiSaver: kiwiSaver.employerContribution,
    accLevy: accCalc.levy,
    accLevyDetails: {
      ytdEarnings: accCalc.ytdEarnings,
      remainingCap: accCalc.remainingCap
    },
    netPay,
    minimumWageCheck
  };
}