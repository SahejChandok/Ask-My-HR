import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { processPayroll, submitPayrollRun } from '../../../services/payroll';
import { useAuth } from '../../../contexts/AuthContext';
import { PayrollResultData } from '../../../types';

const PROCESS_STEPS = [
  { path: '/payroll/process', label: 'Period Selection' },
  { path: '/payroll/process/review', label: 'Review & Calculate' },
  { path: '/payroll/process/finalize', label: 'Finalize & Approve' }
];

interface PayrollProcessStepsProps {
  periodStart?: string;
  periodEnd?: string;
  results?: PayrollResultData[];
  onComplete?: () => void;
}

export function PayrollProcessSteps({ 
  periodStart,
  periodEnd,
  results,
  onComplete 
}: PayrollProcessStepsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const currentStepIndex = PROCESS_STEPS.findIndex(step => 
    location.pathname === step.path
  );

  async function handleFinalize() {
    if (!user?.tenant_id || !periodStart || !periodEnd || !results) {
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

      onComplete?.();
      navigate('/payroll/history');
    } catch (error) {
      console.error('Error finalizing payroll:', error);
      setError(error instanceof Error ? error.message : 'Failed to finalize payroll');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        {PROCESS_STEPS.map((step, index) => (
          <React.Fragment key={step.path}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <div className="flex items-center">
              <span className={`
                w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center
                ${index < currentStepIndex 
                  ? 'bg-indigo-600 text-white'
                  : index === currentStepIndex
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500'}
              `}>
                {index + 1}
              </span>
              <span className={`
                ml-2 text-sm font-medium
                ${index === currentStepIndex ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {currentStepIndex === 2 && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/payroll/process/review')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleFinalize}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              'Finalize Payroll'
            )}
          </button>
        </div>
      )}
    </div>
  );
}