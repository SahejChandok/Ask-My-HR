import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export interface PayrollRunSummary {
  processedBy: string;
  processedAt: string;
  rollback?: {
    rolledBackBy: string;
    timestamp: string;
    reason: string;
  };
}

export function usePayrollHistory(runId?: string) {
  const [summary, setSummary] = useState<PayrollRunSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadSummary() {
      if (!runId) {
        setSummary(null);
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        // Get payroll run details with processed by user and rollback info
        const { data: runData, error: runError } = await supabase
          .from('payroll_runs')
          .select(`
            *,
            processed_by:users!processed_by(email),
            payroll_rollback_logs(
              rolled_back_by:users!rolled_back_by(email),
              reason,
              created_at
            )
          `)
          .eq('id', runId)
          .single();

        if (runError) throw runError;

        setSummary({
          processedBy: runData.processed_by.email,
          processedAt: runData.created_at,
          rollback: runData.payroll_rollback_logs[0] ? {
            rolledBackBy: runData.payroll_rollback_logs[0].rolled_back_by.email,
            timestamp: runData.payroll_rollback_logs[0].created_at,
            reason: runData.payroll_rollback_logs[0].reason
          } : undefined
        });
      } catch (error) {
        console.error('Error loading payroll run summary:', error);
        setError('Failed to load payroll run details');
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [runId]);

  return { summary, loading, error };
}