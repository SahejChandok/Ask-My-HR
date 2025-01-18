import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayrollResults } from '../../../components/payroll/PayrollResults';
import { usePayrollProcessing } from '../../../hooks/usePayrollProcessing';
import { Loader2 } from 'lucide-react';

export function ReviewCalculate() {
  const navigate = useNavigate();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
  const { loading, error, results, logs } = usePayrollProcessing();

  return (
    <div className="space-y-6">
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
            logs={logs}
            onEmployeeSelect={setSelectedEmployeeId}
            selectedEmployeeId={selectedEmployeeId}
          />
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/payroll/process')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => navigate('/payroll/process/finalize')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Continue to Finalize
            </button>
          </div>
        </>
      )}
    </div>
  );
}