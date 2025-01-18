import { KIWISAVER } from './constants';

/**
 * Calculate KiwiSaver deductions
 */
export function calculateKiwiSaverDeductions(
  grossPay: number,
  employeeRate: number,
  isEnrolled: boolean
): {
  employeeDeduction: number;
  employerContribution: number;
} {
  if (!isEnrolled) {
    return {
      employeeDeduction: 0,
      employerContribution: 0
    };
  }

  // Ensure rate is within valid range
  const validRate = Math.max(
    KIWISAVER.MIN_EMPLOYEE_RATE,
    Math.min(employeeRate / 100, KIWISAVER.MAX_EMPLOYEE_RATE)
  );

  return {
    employeeDeduction: grossPay * validRate,
    employerContribution: grossPay * KIWISAVER.EMPLOYER_RATE
  };
}