import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { validatePayrollPeriod } from '../../../utils/payrollValidation';
import { PayrollRun, PayrollResultData, PayrollCalculationLog } from '../../../types';

export function usePayrollProcessing(
  periodStart: string,
  periodEnd: string,
  tenantId?: string
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [validationError, setValidationError] = useState<string>();
  const [overlappingRuns, setOverlappingRuns] = useState<PayrollRun[]>();
  const [logs, setLogs] = useState<PayrollCalculationLog[]>([]);
  const [results, setResults] = useState<PayrollResultData[]>([]);

  async function processPayroll(userId: string) {
    if (!tenantId) return false;
    
    setLoading(true);
    setError(undefined);
    setValidationError(undefined);
    setOverlappingRuns(undefined);
    setLogs([]);

    try {
      // Check connection first
      const { data: connectionTest } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      if (!connectionTest) {
        throw new Error('Unable to connect to the server. Please try again.');
      }

      // Validate period first
      const validation = await validatePayrollPeriod(tenantId, periodStart, periodEnd);
      if (!validation.valid) {
        if (validation.overlappingRuns?.length) {
          setOverlappingRuns(validation.overlappingRuns);
          setValidationError('A payroll run already exists for this period');
        } else {
          setValidationError(validation.message);
        }
        return false;
      }

      const { data, error: processError } = await supabase
        .rpc('process_payroll', {
          p_tenant_id: tenantId,
          p_user_id: userId,
          p_period_start: periodStart,
          p_period_end: periodEnd
        });

      if (processError) {
        if (processError.message.includes('already exists')) {
          setValidationError('A payroll run already exists for this period');
          const { data: runs } = await supabase
            .from('payroll_runs')
            .select('*')
            .eq('tenant_id', tenantId)
            .overlaps('period_start', periodStart, 'period_end', periodEnd);
          setOverlappingRuns(runs || []);
        } else {
          throw processError;
        }
        return false;
      }
      
      if (!data || data.length === 0) {
        setValidationError('No payroll data found for this period');
        return false;
      }

      setResults(data);

      // Fetch calculation logs
      const { data: logData, error: logError } = await supabase
        .from('payroll_calculation_logs')
        .select('*')
        .order('created_at', { ascending: true });

      if (logError) throw logError;
      setLogs(logData || []);

      return true;
    } catch (error) {
      console.error('Error processing payroll:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to the server. Please check your connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    validationError,
    overlappingRuns,
    logs,
    results,
    processPayroll
  };
}