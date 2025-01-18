import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const FILING_STEPS = [
  { path: '/ird/filing', label: 'Select Payroll Run' },
  { path: '/ird/filing/validate', label: 'Validate Data' },
  { path: '/ird/filing/submit', label: 'Submit Filing' }
];

export function IRDSteps() {
  const location = useLocation();
  const currentStepIndex = FILING_STEPS.findIndex(step => 
    location.pathname === step.path
  );

  return (
    <div className="flex items-center space-x-4">
      {FILING_STEPS.map((step, index) => (
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