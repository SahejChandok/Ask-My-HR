import { supabase } from '../lib/supabase';
import { PayrollResultData, TimesheetEntry } from '../types';

interface PerformanceMetrics {
  timesheetLoadTime: number;
  calculationTime: number;
  saveTime: number;
  totalTime: number;
  employeeCount: number;
  timesheetCount: number;
  batchCount: number;
  averageBatchTime: number;
}

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

export async function bulkLoadEmployees(employeeIds: string[], tenantId: string) {
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
  // Process in batches of 100
  const BATCH_SIZE = 100;
  const batches = [];
  
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  // Process batches concurrently but with a limit
  const CONCURRENT_BATCHES = 3;
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    const batchPromises = batches
      .slice(i, i + CONCURRENT_BATCHES)
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

export async function measurePayrollPerformance(
  startTime: number,
  metrics: Partial<PerformanceMetrics>
): Promise<PerformanceMetrics> {
  const endTime = performance.now();
  return {
    timesheetLoadTime: metrics.timesheetLoadTime || 0,
    calculationTime: metrics.calculationTime || 0,
    saveTime: metrics.saveTime || 0,
    totalTime: endTime - startTime,
    employeeCount: metrics.employeeCount || 0,
    timesheetCount: metrics.timesheetCount || 0,
    batchCount: metrics.batchCount || 0,
    averageBatchTime: metrics.saveTime 
      ? metrics.saveTime / (metrics.batchCount || 1) 
      : 0
  };
}