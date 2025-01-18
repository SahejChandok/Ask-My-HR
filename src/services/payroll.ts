import { supabase } from '../lib/supabase';
import { PayrollResultData } from '../types';
import { savePayrollResults } from '../utils/payroll/calculations';

export async function processPayroll(
  tenantId: string,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<PayrollResultData[]> {
  // Get ACC YTD earnings first
  const { data: accData } = await supabase
    .from('acc_levy_tracking')
    .select('employee_id, ytd_earnings')
    .eq('tax_year', '2024-2025');

  // Convert to required format
  const accEarnings = accData?.reduce((acc, curr) => ({
    ...acc,
    [curr.employee_id]: curr.ytd_earnings
  }), {});

  // Process payroll
  const { data: payrollRun, error: runError } = await supabase
    .from('payroll_runs')
    .insert({
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
      processed_by: userId,
      status: 'completed'
    })
    .select()
    .single();

  if (runError) {
    throw new Error(`Error creating payroll run: ${runError.message}`);
  }

  // Process calculations
  const { data, error } = await supabase
    .rpc('process_payroll', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_acc_earnings: accEarnings || {}
    });

  if (error) {
    throw new Error(`Error processing payroll: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No payroll data found for this period');
  }

  // Save results
  const { success, error: saveError } = await savePayrollResults(payrollRun.id, data);
  if (!success) {
    throw new Error(`Error saving payroll results: ${saveError}`);
  }

  return data;
}

export async function submitPayrollRun(
  tenantId: string,
  userId: string,
  periodStart: string,
  periodEnd: string,
  results: PayrollResultData[]
): Promise<void> {
  // Create payroll run
  const { data: payrollRun, error: runError } = await supabase
    .from('payroll_runs')
    .insert({
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
      processed_by: userId,
      status: 'completed'
    })
    .select()
    .single();

  if (runError) {
    throw new Error(`Error creating payroll run: ${runError.message}`);
  }

  // Save results
  const { success, error: saveError } = await savePayrollResults(payrollRun.id, results);
  if (!success) {
    throw new Error(`Error saving payroll results: ${saveError}`);
  }
}