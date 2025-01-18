import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PayrollRun, PayrollResultData } from '../../types';
import { PayrollHistory as PayrollHistoryComponent } from '../../components/payroll/PayrollHistory';
import { Loader2 } from 'lucide-react';

export function PayrollHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [payslips, setPayslips] = useState<PayrollResultData[]>([]);

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
    } finally {
      setLoading(false);
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
          netPay: payslip.net_pay,
          accLevy: payslip.acc_levy || 0,
          accLevyDetails: payslip.acc_ytd_earnings ? {
            ytdEarnings: payslip.acc_ytd_earnings,
            remainingCap: payslip.acc_remaining_cap || 0
          } : undefined
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payroll History</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <PayrollHistoryComponent
        payrollRuns={payrollRuns}
        onSelect={handleRunSelect}
        onDelete={handleRunDelete}
        selectedRunId={selectedRunId}
        isDeleting={isDeleting}
        payslips={payslips}
      />
    </div>
  );
}