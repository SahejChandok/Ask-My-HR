import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';
import { PayrollRun } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { rollbackPayrollRun } from '../../utils/payroll/rollback';
import { useAuth } from '../../contexts/AuthContext';

interface PayrollRollbackProps {
  run: PayrollRun;
  onClose: () => void;
  onRollback: () => void;
}

export function PayrollRollback({ run, onClose, onRollback }: PayrollRollbackProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [reason, setReason] = useState('');

  async function handleRollback() {
    if (!user?.id) {
      setError('Your session has expired. Please sign in again.');
      return;
    }
    
    if (!reason.trim()) {
      setError('Please provide a reason for rolling back the payroll run');
      return;
    }

    try {
      setLoading(true);
      setError(undefined);
      
      const { success, error: rollbackError } = await rollbackPayrollRun(
        run.id,
        user.id,
        reason.trim()
      );
      
      if (success) {
        onRollback();
        onClose();
      } else {
        setError(rollbackError || 'Failed to rollback payroll run');
      }
    } catch (error) {
      console.error('Error in rollback:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Rollback Payroll Run
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to rollback the payroll run for period{' '}
                {formatDisplayDate(run.period_start)} to {formatDisplayDate(run.period_end)}?
              </p>
              <p className="mt-2 text-sm text-gray-500">
                This will:
              </p>
              <ul className="mt-1 text-sm text-gray-500 list-disc list-inside">
                <li>Void all generated payslips</li>
                <li>Reopen approved timesheets</li>
                <li>Reset leave balances</li>
                <li>Mark the payroll run as voided</li>
              </ul>
              <p className="mt-2 text-sm font-medium text-red-600">
                This action cannot be undone.
              </p>

              <div className="mt-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Reason for rollback
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={3}
                  placeholder="Please provide a reason for rolling back this payroll run"
                />
              </div>
            </div>

            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-4 flex space-x-3">
              <button
                type="button"
                onClick={handleRollback}
                disabled={loading || !reason.trim()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Rollback
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}