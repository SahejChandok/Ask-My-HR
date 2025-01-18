import { EmployeeProfile, TimesheetEntry } from '../../types';
import { supabase } from '../../lib/supabase';
import { calculateDeductions } from '../tax/deductionCalculations';

interface PayrollResult {
  success: boolean;
  error?: string;
  data?: any;
}

export function calculateGrossPay(
  employee: EmployeeProfile,
  entries: TimesheetEntry[],
  payPeriod: 'weekly' | 'fortnightly' | 'monthly' = 'fortnightly'
): number {
  if (!entries || entries.length === 0) return 0;

  // For salaried employees, calculate per-period rate
  if (employee.employment_type === 'salary') {
    const annualSalary = employee.hourly_rate * 2080; // 40 hours * 52 weeks
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

  // For hourly employees, calculate with overtime and holiday rates
  return entries.reduce((total, entry) => {
    const startTime = new Date(`1970-01-01T${entry.start_time}`);
    const endTime = new Date(`1970-01-01T${entry.end_time}`);
    const breakMinutes = entry.break_minutes || 0;
    
    let millisWorked = endTime.getTime() - startTime.getTime();
    if (endTime < startTime) {
      millisWorked += 24 * 60 * 60 * 1000; // Add 24 hours if end time is next day
    }
    millisWorked -= (breakMinutes * 60 * 1000);
    const hoursWorked = millisWorked / (1000 * 60 * 60);
    
    const rate = entry.rate_multiplier || 1.0;
    const pay = hoursWorked * employee.hourly_rate * rate;
    
    return total + pay;
  }, 0);
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

export async function savePayrollResults(
  runId: string,
  results: PayrollResultData[]
): Promise<PayrollResult> {
  try {
    // Validate input
    if (!runId || !results?.length) {
      return {
        success: false,
        error: 'Invalid payroll data'
      };
    }

    // Get tenant_id from payroll run
    const { data: run, error: runError } = await supabase
      .from('payroll_runs')
      .select('tenant_id')
      .eq('id', runId)
      .single();

    if (runError) {
      throw new Error('Failed to get payroll run details');
    }

    // Create payslips in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, Math.min(i + BATCH_SIZE, results.length));
      
      const { error } = await supabase
        .from('payslips')
        .insert(batch.map(result => ({
          payroll_run_id: runId,
          tenant_id: run.tenant_id,
          employee_id: result.employee.id,
          gross_pay: result.calculations.grossPay,
          kiwisaver_deduction: result.calculations.kiwiSaverDeduction,
          employer_kiwisaver: result.calculations.employerKiwiSaver,
          paye_tax: result.calculations.payeTax,
          net_pay: result.calculations.netPay
        })));

      if (error) {
        throw new Error(`Failed to save payslips: ${error.message}`);
      }
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error saving payroll results:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save payroll results'
    };
  }
}