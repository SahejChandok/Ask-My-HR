import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PayrollRun } from '../../../types';
import { formatDisplayDate } from '../../../utils/dateUtils';

interface PayrollErrorProps {
  error: string;
  overlappingRuns?: PayrollRun[];
}

export function PayrollError({ error, overlappingRuns }: PayrollErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
          {overlappingRuns && overlappingRuns.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
              {overlappingRuns.map((run) => (
                <li key={run.id}>
                  {formatDisplayDate(run.period_start)} - {formatDisplayDate(run.period_end)}
                  {' '}({run.status})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}