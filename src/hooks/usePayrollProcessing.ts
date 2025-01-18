import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateNetPay } from '../utils/payrollCalculations';
import { validatePayrollPeriod } from '../utils/payrollValidation';
import { PayrollRun, EmployeeProfile } from '../types';
import { formatAPIDate } from '../utils/dateUtils';

export function usePayrollProcessing(periodStart: string, periodEnd: string, tenantId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [overlappingRuns, setOverlappingRuns] = useState<PayrollRun[]>();
  const [results, setResults] = useState<Array<{
    employee: EmployeeProfile;
    calculations: ReturnType<typeof calculateNetPay>;
  }>>([]);

  async function processPayroll(userId: string) {
    if (!tenantId) return;
    
    setLoading(true);
    setError(undefined);

    try {
      const validation = await validatePayrollPeriod(tenantId, periodStart, periodEnd);

      if (!validation.valid) {
        setError(validation.message);
        setOverlappingRuns(validation.overlappingRuns);
        return false;
      }

      const { data: employees, error: employeesError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('tenant_id', tenantId);

      if (employeesError) throw employeesError;

      const payrollResults = await Promise.all(
        employees.map(async (employee) => {
          const { data: entries, error: entriesError } = await supabase
            .from('timesheet_entries')
            .select('*, timesheets!inner(*)')
            .gte('date', periodStart)
            .lte('date', periodEnd)
            .eq('timesheets.employee_id', employee.id);

          if (entriesError) throw entriesError;

          return {
            employee,
            calculations: calculateNetPay(employee, entries || [])
          };
        })
      );

      setResults(payrollResults);

      const { error: runError } = await supabase.from('payroll_runs').insert({
        tenant_id: tenantId,
        period_start: periodStart,
        period_end: periodEnd,
        processed_by: userId,
        status: 'completed',
      });

      if (runError) throw runError;

      return true;
    } catch (error) {
      console.error('Error processing payroll:', error);
      setError('Failed to process payroll');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    overlappingRuns,
    results,
    processPayroll
  };
}