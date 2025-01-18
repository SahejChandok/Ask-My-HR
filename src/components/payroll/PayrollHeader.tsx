import React from 'react';
import { Loader2, Play } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface PayrollHeaderProps {
  periodStart: string;
  periodEnd: string;
  loading: boolean;
  onProcess: () => void;
}

export function PayrollHeader({ periodStart, periodEnd, loading, onProcess }: PayrollHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Process Payroll Run
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Period: {new Date(periodStart).toLocaleDateString()} -{' '}
          {new Date(periodEnd).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={onProcess}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
        Process Payroll
      </button>
    </div>
  );
}