import { supabase } from '../lib/supabase';
import { PayrollResultData, TimesheetEntry, EmployeeProfile } from '../types';

const BATCH_SIZE = 100;
const MAX_CONCURRENT_BATCHES = 3;

export async function bulkLoadTimesheets(
  tenantId: string,
  periodStart: string,
  periodEnd: string
): Promise<{entries: TimesheetEntry[], employeeIds: string[]}> {
  // Use the optimized database function
  const { data, error } = await supabase
    .rpc('bulk_load_timesheets', {
      p_tenant_id: tenantId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    });

  if (error) throw error;

  // Extract unique employee IDs
  const employeeIds = [...new Set(data?.map(entry => entry.employee_id))];

  return {
    entries: data || [],
    employeeIds
  };
}

export async function bulkLoadEmployees(
  employeeIds: string[],
  tenantId: string
): Promise<EmployeeProfile[]> {
  if (!employeeIds.length) return [];

  // Use the optimized database function
  const { data, error } = await supabase
    .rpc('bulk_load_employees', {
      p_tenant_id: tenantId,
      p_employee_ids: employeeIds
    });

  if (error) throw error;
  return data || [];
}

export async function bulkSavePayrollResults(
  payrollRunId: string,
  results: PayrollResultData[]
) {
  // Process in batches
  const batches = [];
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  // Process batches concurrently but with a limit
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const batchPromises = batches
      .slice(i, i + MAX_CONCURRENT_BATCHES)
      .map(batch => 
        supabase.rpc('bulk_create_payslips', {
          p_payroll_run_id: payrollRunId,
          p_payslips: batch.map(result => ({
            employee_id: result.employee.id,
            gross_pay: result.calculations.grossPay,
            kiwisaver_deduction: result.calculations.kiwiSaverDeduction,
            employer_kiwisaver: result.calculations.employerKiwiSaver,
            paye_tax: result.calculations.payeTax,
            net_pay: result.calculations.netPay
          }))
        })
      );

    await Promise.all(batchPromises);
  }
}

export async function bulkSaveCalculationLogs(
  payrollRunId: string,
  logs: Array<{
    employeeId: string;
    logType: string;
    details: Record<string, any>;
  }>
) {
  // Process in batches
  const batches = [];
  for (let i = 0; i < logs.length; i += BATCH_SIZE) {
    const batch = logs.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  // Process batches concurrently but with a limit
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const batchPromises = batches
      .slice(i, i + MAX_CONCURRENT_BATCHES)
      .map(batch => 
        supabase
          .from('payroll_calculation_logs')
          .insert(batch.map(log => ({
            payroll_run_id: payrollRunId,
            employee_id: log.employeeId,
            log_type: log.logType,
            details: log.details
          })))
      );

    await Promise.all(batchPromises);
  }
}