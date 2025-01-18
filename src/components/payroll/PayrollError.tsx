import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PayrollRun } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';

interface PayrollErrorProps {
  error: string;
  overlappingRuns?: PayrollRun[];
  isValidationError?: boolean;
}

export function PayrollError({ error, overlappingRuns, isValidationError }: PayrollErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
          {isValidationError && overlappingRuns && overlappingRuns.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
              {overlappingRuns.map((run) => (
                <li key={run.id}>
                  Payroll run exists for {formatDisplayDate(run.period_start)} to{' '}
                  {formatDisplayDate(run.period_end)} ({run.status})
                </li>
              ))}
              <div className="mt-2 text-sm text-red-700 font-medium">
                To proceed, either:
                <ul className="ml-4 mt-1 list-disc">
                  <li>Select a different pay period</li>
                  <li>Cancel or void the existing payroll run</li>
                </ul>
              </div>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}