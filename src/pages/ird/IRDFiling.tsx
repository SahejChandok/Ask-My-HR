import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDisplayDate } from '../../utils/dateUtils';
import { PayrollRun } from '../../types';
import { Loader2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export function IRDFiling() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [pendingRuns, setPendingRuns] = useState<PayrollRun[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    loadPendingRuns();
  }, [user?.tenant_id]);

  async function loadPendingRuns() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      // Get completed payroll runs that haven't been filed
      const { data, error: runsError } = await supabase
        .from('payroll_runs')
        .select(`
          id,
          period_start,
          period_end,
          status,
          ird_filings!left(id)
        `)
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'completed')
        .is('ird_filings.id', null)
        .order('period_start', { ascending: false });

      if (runsError) throw runsError;
      setPendingRuns(data || []);

    } catch (error) {
      console.error('Error loading pending runs:', error);
      setError('Failed to load pending payroll runs');
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-semibold text-gray-900">IRD Filing</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      {pendingRuns.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                No Pending Filings
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>All completed payroll runs have been filed with IRD.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Pending Filings
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {pendingRuns.length} payroll run{pendingRuns.length === 1 ? '' : 's'} pending submission
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {pendingRuns.map(run => (
              <div
                key={run.id}
                className="p-6 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Pay Period: {formatDisplayDate(run.period_start)} - {formatDisplayDate(run.period_end)}
                    </h4>
                  </div>
                  <Link
                    to={`/ird/filing/submit/${run.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Filing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}