import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PayrollResultData, PayrollCalculationLog, PayrollRun } from '../types';
import { PayrollForm } from '../components/payroll/PayrollForm';
import { PayrollResults } from '../components/payroll/PayrollResults';
import { PayrollHistory } from '../components/payroll/PayrollHistory';
import { Loader2 } from 'lucide-react';

export function Payroll() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [payslips, setPayslips] = useState<PayrollResultData[]>([]);
  const [results, setResults] = useState<PayrollResultData[]>([]);
  const [logs, setLogs] = useState<PayrollCalculationLog[]>([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();

  useEffect(() => {
    loadPayrollHistory();
  }, [user?.tenant_id]);

  async function loadPayrollHistory() {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('period_start', { ascending: false });

      if (error) throw error;
      setPayrollRuns(data || []);
    } catch (error) {
      console.error('Error loading payroll history:', error);
      setError('Failed to load payroll history');
    }
  }

  async function handleRunSelect(runId: string) {
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

      setPayslips(data?.map(payslip => ({
        employee: payslip.employee_profiles,
        calculations: {
          grossPay: payslip.gross_pay,
          kiwiSaverDeduction: payslip.kiwisaver_deduction,
          employerKiwiSaver: payslip.employer_kiwisaver,
          payeTax: payslip.paye_tax,
          netPay: payslip.net_pay
        },
        payrollRunId: payslip.payroll_run_id
      })) || []);

      setSelectedRunId(runId);
    } catch (error) {
      console.error('Error loading payslips:', error);
      setError('Failed to load payslip details');
    }
  }

  async function handleRunDelete(runId: string) {
    if (!confirm('Are you sure you want to delete this payroll run?')) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('payroll_runs')
        .delete()
        .eq('id', runId);

      if (error) throw error;
      await loadPayrollHistory();
      setSelectedRunId(undefined);
      setPayslips([]);
    } catch (error) {
      console.error('Error deleting payroll run:', error);
      setError('Failed to delete payroll run');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleProcessPayroll(startDate: string, endDate: string) {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    setError(undefined);
    setLogs([]);

    try {
      const { data, error: processError } = await supabase
        .rpc('process_payroll', {
          p_tenant_id: user.tenant_id,
          p_user_id: user.id,
          p_period_start: startDate,
          p_period_end: endDate
        });

      if (processError) throw processError;
      
      if (!data || data.length === 0) {
        setError('No payroll data found for this period');
        return;
      }
      
      setResults(data || []);
      setPeriodStart(startDate);
      setPeriodEnd(endDate);

      // Fetch calculation logs
      const { data: logData, error: logError } = await supabase
        .from('payroll_calculation_logs')
        .select('*')
        .order('created_at', { ascending: true });

      if (logError) throw logError;
      setLogs(logData || []);

      await loadPayrollHistory();
    } catch (error) {
      console.error('Error processing payroll:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payroll</h1>
      </div>

      <PayrollForm 
        onSubmit={handleProcessPayroll}
        loading={loading}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <>
          <PayrollHistory
            payrollRuns={payrollRuns}
            onSelect={handleRunSelect}
            onDelete={handleRunDelete}
            selectedRunId={selectedRunId}
            isDeleting={isDeleting}
            payslips={payslips}
          />
          {results.length > 0 && (
            <PayrollResults 
              results={results}
              periodStart={periodStart}
              periodEnd={periodEnd}
              logs={logs}
              onEmployeeSelect={setSelectedEmployeeId}
              selectedEmployeeId={selectedEmployeeId}
            />
          )}
        </>
      )}
    </div>
  );
}