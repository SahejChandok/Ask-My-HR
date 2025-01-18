import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validatePayrollPeriod } from '../../utils/payrollValidation';

interface PayrollFormProps {
  onSubmit: (startDate: string, endDate: string) => void;
  loading?: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function PayrollForm({ onSubmit, loading, initialStartDate, initialEndDate }: PayrollFormProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<{
    message: string;
    details?: string[];
  }>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(undefined);
    setValidating(true);

    try {
      if (!user?.tenant_id) {
        throw new Error('User session expired. Please sign in again.');
      }

      // Validate period first
      const validation = await validatePayrollPeriod(
        user.tenant_id,
        startDate,
        endDate
      );

      if (!validation.valid) {
        setValidationError({
          message: validation.message || 'Invalid payroll period',
          details: validation.details?.overlappingPeriods
        });
        return;
      }

    onSubmit(startDate, endDate);
    } catch (err) {
      setValidationError({
        message: err instanceof Error ? err.message : 'Failed to validate period'
      });
    } finally {
      setValidating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      {validationError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          <p className="font-medium">{validationError.message}</p>
          {validationError.details && validationError.details.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {validationError.details.map((detail, index) => (
                <li key={index} className="text-sm">{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading || validating || !startDate || !endDate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(loading || validating) ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Processing...' : validating ? 'Validating...' : 'Process Payroll'}
        </button>
      </div>
    </form>
  );
}