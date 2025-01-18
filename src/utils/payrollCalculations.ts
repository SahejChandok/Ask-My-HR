import { EmployeeProfile, TimesheetEntry, LeaveRequest } from '../types';
import { calculateDeductions } from './tax/deductionCalculations';
import { calculateLeaveHours } from './leaveCalculations';
import { calculateWorkDays } from './leaveCalculations';

export function calculateGrossPay(
  employee: EmployeeProfile,
  entries: TimesheetEntry[],
  leaveRequests: LeaveRequest[] = [],
  payPeriod: 'weekly' | 'fortnightly' | 'monthly' = 'fortnightly'
): number {
  if (!entries || entries.length === 0) return 0;

  // Calculate regular hours
  const regularHours = entries.reduce((total, entry) => {
    const startTime = new Date(`1970-01-01T${entry.start_time}`);
    const endTime = new Date(`1970-01-01T${entry.end_time}`);
    const breakMinutes = entry.break_minutes || 0;
    
    let millisWorked = endTime.getTime() - startTime.getTime();
    if (endTime < startTime) {
      millisWorked += 24 * 60 * 60 * 1000;
    }
    millisWorked -= (breakMinutes * 60 * 1000);
    return total + (millisWorked / (1000 * 60 * 60));
  }, 0);

  // Calculate leave hours and pay
  const leavePay = leaveRequests.reduce((total, request) => {
    if (request.status !== 'approved') return total;
    const workDays = calculateWorkDays(
      new Date(request.start_date),
      new Date(request.end_date)
    );
    const leaveHours = workDays * 8; // Standard 8-hour day
    return total + (leaveHours * employee.hourly_rate);
  }, 0);

  // For salaried employees, calculate per-period rate
  if (employee.employment_type === 'salary') {
    const annualSalary = employee.hourly_rate * 2080;
    switch (payPeriod) {
      case 'weekly':
        return annualSalary / 52;
      case 'monthly':
        return annualSalary / 12;
      case 'fortnightly':
      default:
        return annualSalary / 26;
    }
  }

  return (regularHours * employee.hourly_rate) + leavePay;
}

export function calculateNetPay(
  employee: EmployeeProfile,
  entries: TimesheetEntry[],
  payPeriod: 'weekly' | 'fortnightly' | 'monthly' = 'fortnightly'
): {
  grossPay: number;
  kiwiSaverDeduction: number;
  employerKiwiSaver: number;
  payeTax: number;
  accLevy: number;
  netPay: number;
} {
  const grossPay = calculateGrossPay(employee, entries, payPeriod);
  const deductions = calculateDeductions(grossPay, employee, payPeriod);

  return { grossPay, ...deductions };
}