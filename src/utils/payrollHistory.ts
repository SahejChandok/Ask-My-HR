import { supabase } from '../lib/supabase';
import { PayrollRun, PayrollResultData } from '../types';
import { formatDisplayDate } from './dateUtils';

export interface PayrollRunSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  employeeCount: number;
  totals: {
    gross: number;
    net: number;
    kiwisaver: number;
    paye: number;
  };
  processedBy: string;
  processedAt: string;
  rollback?: {
    rolledBackBy: string;
    reason: string;
    timestamp: string;
  };
}

export async function getPayrollRunSummary(runId: string): Promise<PayrollRunSummary | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_payroll_run_summary', { p_run_id: runId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payroll run summary:', error);
    return null;
  }
}

export async function getPayrollRunPayslips(runId: string): Promise<PayrollResultData[]> {
  try {
    const { data, error } = await supabase
      .from('payslips')
      .select(`
        *,
        employee_profiles (
          id, first_name, last_name, email,
          employment_type, kiwisaver_rate,
          kiwisaver_enrolled, tax_code
        )
      `)
      .eq('payroll_run_id', runId);

    if (error) throw error;

    return data?.map(payslip => ({
      employee: payslip.employee_profiles,
      calculations: {
        grossPay: payslip.gross_pay,
        kiwiSaverDeduction: payslip.kiwisaver_deduction,
        employerKiwiSaver: payslip.employer_kiwisaver,
        payeTax: payslip.paye_tax,
        netPay: payslip.net_pay
      },
      payrollRunId: payslip.payroll_run_id
    })) || [];
  } catch (error) {
    console.error('Error fetching payroll run payslips:', error);
    return [];
  }
}

export async function deletePayrollRun(runId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payroll_runs')
      .delete()
      .eq('id', runId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting payroll run:', error);
    return false;
  }
}

export async function rollbackPayrollRun(
  runId: string,
  userId: string,
  reason: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .rpc('rollback_payroll_run', {
        p_run_id: runId,
        p_user_id: userId,
        p_reason: reason
      });

    if (error) {
      if (error.message.includes('Unauthorized')) {
        throw new Error('You do not have permission to rollback payroll runs');
      }
      if (error.message.includes('Only completed')) {
        throw new Error('Only completed payroll runs can be rolled back');
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error rolling back payroll run:', error);
    throw error;
  }
}

export function calculatePayrollTotals(payslips: PayrollResultData[]) {
  return payslips.reduce(
    (acc, { calculations }) => ({
      gross: acc.gross + calculations.grossPay,
      kiwisaver: acc.kiwisaver + calculations.kiwiSaverDeduction,
      employerKiwisaver: acc.employerKiwisaver + calculations.employerKiwiSaver,
      paye: acc.paye + calculations.payeTax,
      net: acc.net + calculations.netPay,
    }),
    { gross: 0, kiwisaver: 0, employerKiwisaver: 0, paye: 0, net: 0 }
  );
}