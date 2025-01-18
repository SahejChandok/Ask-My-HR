import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const PROCESS_STEPS = [
  { path: '/payroll/process', label: 'Period Selection' },
  { path: '/payroll/process/review', label: 'Review & Calculate' },
  { path: '/payroll/process/finalize', label: 'Finalize & Approve' }
];

export function PayrollSteps() {
  const location = useLocation();
  const currentStepIndex = PROCESS_STEPS.findIndex(step => 
    location.pathname === step.path
  );

  return (
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
  );
}