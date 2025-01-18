import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeeForm } from './EmployeeForm';
import { DocumentUpload } from './DocumentUpload';
import { ContractGenerator } from './ContractGenerator';

export function EmployeeOnboarding() {
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState<string>();

  return (
    <div className="space-y-8">
      {/* Step 1: Basic Details */}
      {step === 1 && (
        <EmployeeForm
          onSubmit={(id) => {
            setEmployeeId(id);
            setStep(2);
          }}
        />
      )}

      {/* Step 2: Documents */}
      {step === 2 && employeeId && (
        <DocumentUpload
          employeeId={employeeId}
          onComplete={() => setStep(3)}
        />
      )}

      {/* Step 3: Contract */}
      {step === 3 && employeeId && (
        <ContractGenerator
          employeeId={employeeId}
          onComplete={() => setStep(4)}
        />
      )}
    </div>
  );
}