import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ValidationResult } from '../../utils/irdValidation';

interface IRDFilingValidationProps {
  validation: ValidationResult;
}

export function IRDFilingValidation({ validation }: IRDFilingValidationProps) {
  if (!validation.details) return null;

  const { errors, warnings } = validation.details;
  const hasIssues = errors.length > 0 || warnings.length > 0;

  if (!hasIssues) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Validation Passed
            </h3>
            <p className="mt-2 text-sm text-green-700">
              All validation checks passed successfully. You can now submit this filing to IRD.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Errors
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-sm text-red-700 font-medium">
                These errors must be fixed before filing
              </p>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Validation Warnings
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-sm text-yellow-700">
                You can proceed with filing, but please review these warnings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}