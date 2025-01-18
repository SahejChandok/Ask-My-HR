import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { processPayroll, submitPayrollRun } from '../../services/payroll';
import { PayrollResultData } from '../../types';
import { PayrollForm } from '../../components/payroll/PayrollForm';
import { PayrollResults } from '../../components/payroll/PayrollResults';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PayrollProcess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [results, setResults] = useState<PayrollResultData[]>([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleProcessPayroll(startDate: string, endDate: string) {
    if (!user?.tenant_id) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(undefined);
    setPeriodStart(startDate);
    setPeriodEnd(endDate);

    try {
      // Process payroll calculations
      const data = await processPayroll(
        user.tenant_id,
        user.id,
        startDate,
        endDate
      );

      setResults(data);
    } catch (error) {
      console.error('Error processing payroll:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPayroll() {
    if (!user?.tenant_id || !periodStart || !periodEnd || !results.length) {
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      await submitPayrollRun(
        user.tenant_id,
        user.id,
        periodStart,
        periodEnd,
        results
      );

      navigate('/payroll/history');
    } catch (error) {
      console.error('Error submitting payroll:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit payroll');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Process Payroll</h1>
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
      ) : results.length > 0 && (
        <>
          <PayrollResults
            results={results}
            periodStart={periodStart}
            periodEnd={periodEnd}
            onEmployeeSelect={setSelectedEmployeeId}
            selectedEmployeeId={selectedEmployeeId}
          />

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleSubmitPayroll}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payroll'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}