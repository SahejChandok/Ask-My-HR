import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { calculateNetPay } from '../../utils/payrollCalculations';
import { validatePayrollPeriod } from '../../utils/payrollValidation';
import { PayrollRun, EmployeeProfile, TimesheetEntry } from '../../types';
import { formatAPIDate } from '../../utils/dateUtils';

export function usePayrollProcessing(periodStart: string, periodEnd: string, tenantId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [overlappingRuns, setOverlappingRuns] = useState<PayrollRun[]>();
  const [results, setResults] = useState<Array<{
    employee: EmployeeProfile;
    calculations: ReturnType<typeof calculateNetPay>;
  }>>([]);

  async function processPayroll(userId: string) {
    if (!tenantId) return false;
    
    setLoading(true);
    setError(undefined);

    try {
      const validation = await validatePayrollPeriod(tenantId, periodStart, periodEnd);

      if (!validation.valid) {
        setError(validation.message);
        setOverlappingRuns(validation.overlappingRuns);
        return false;
      }

      // Get all employees
      const { data: employees, error: employeesError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('first_name, last_name');

      if (employeesError) throw employeesError;
      if (!employees?.length) {
        setError('No employees found');
        return false;
      }

      // Process each employee
      const payrollResults = await Promise.all(
        employees.map(async (employee) => {
          // Get approved timesheet entries
          const { data: entries, error: entriesError } = await supabase
            .from('timesheet_entries')
            .select(`
              *,
              timesheets!inner(
                id,
                employee_id,
                status
              )
            `)
            .eq('timesheets.status', 'approved')
            .gte('date', formatAPIDate(new Date(periodStart)))
            .lte('date', formatAPIDate(new Date(periodEnd)))
            .eq('timesheets.employee_id', employee.id);

          if (entriesError) throw entriesError;

          // Calculate pay
          const calculations = calculateNetPay(employee, entries || []);

          return {
            employee,
            calculations
          };
        })
      );

      // Filter out employees with no pay
      const validResults = payrollResults.filter(result => result.calculations.grossPay > 0);
      
      if (validResults.length === 0) {
        setError('No valid payroll data found for this period');
        return false;
      }

      // Create payroll run
      const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .insert({
          tenant_id: tenantId,
          period_start: periodStart,
          period_end: periodEnd,
          processed_by: userId,
          status: 'completed',
          total_gross: validResults.reduce((sum, r) => sum + r.calculations.grossPay, 0),
          total_net: validResults.reduce((sum, r) => sum + r.calculations.netPay, 0)
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create payslips
      const { error: payslipsError } = await supabase
        .from('payslips')
        .insert(
          validResults.map(({ employee, calculations }) => ({
            payroll_run_id: payrollRun.id,
            employee_id: employee.id,
            gross_pay: calculations.grossPay,
            kiwisaver_deduction: calculations.kiwiSaverDeduction,
            employer_kiwisaver: calculations.employerKiwiSaver,
            paye_tax: calculations.payeTax,
            net_pay: calculations.netPay
          }))
        );

      if (payslipsError) throw payslipsError;

      setResults(validResults);
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