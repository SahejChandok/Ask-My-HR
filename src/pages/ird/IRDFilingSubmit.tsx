import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PayrollRun, IRDFiling } from '../../types';
import { validateIRDFiling } from '../../utils/irdValidation';
import { submitIRDFiling } from '../../services/irdIntegration';
import { IRDFilingValidation } from '../../components/ird/IRDFilingValidation';
import { IRDFilingMonitor } from '../../components/ird/IRDFilingMonitor';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export function IRDFilingSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { runId } = useParams<{ runId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [run, setRun] = useState<PayrollRun>();
  const [validation, setValidation] = useState<any>();
  const [filingId, setFilingId] = useState<string>();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPayrollRun();
  }, [user?.tenant_id, runId]);

  async function loadPayrollRun() {
    if (!user?.tenant_id || !runId) return;

    try {
      setLoading(true);
      setError(undefined);

      // Get payroll run details
      const { data, error: runError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', runId)
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'completed')
        .single();

      if (runError) throw runError;
      setRun(data);

      // Validate automatically
      const validationResult = await validateIRDFiling(data.id);
      setValidation(validationResult);

    } catch (error) {
      console.error('Error loading payroll run:', error);
      setError('Failed to load payroll run details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!run) return;

    try {
      setSubmitting(true);
      setError(undefined);

      const { success, error, filingId: newFilingId } = await submitIRDFiling(run.id, user.tenant_id);

      if (!success) {
        throw new Error(error);
      }

      setFilingId(newFilingId);
      setSuccess(true);

    } catch (error) {
      console.error('Error submitting filing:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit filing');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-semibold text-gray-900">Submit IRD Filing</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Filing submitted successfully. Redirecting...
        </div>
      )}

      {validation && (
        <div className="bg-white shadow rounded-lg p-6">
          <IRDFilingValidation validation={validation} />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !validation.valid}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit to IRD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}