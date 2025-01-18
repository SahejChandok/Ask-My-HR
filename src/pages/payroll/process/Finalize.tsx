import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export function Finalize() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleFinalize() {
    setSubmitting(true);
    try {
      // Finalize payroll run
      await finalizePayrollRun();
      navigate('/payroll/history');
    } catch (error) {
      console.error('Error finalizing payroll:', error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Finalize Payroll Run</h2>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Once finalized:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Payslips will be generated</li>
                    <li>Timesheets will be locked</li>
                    <li>Leave balances will be updated</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/payroll/process/review')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Review
            </button>
            <button
              onClick={handleFinalize}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Finalize Payroll Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}