import React from 'react';
import { PayrollResultData } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface PayslipEmployerContributionsProps {
  calculations: PayrollResultData['calculations'];
  employee: PayrollResultData['employee'];
}

export function PayslipEmployerContributions({ 
  calculations, 
  employee 
}: PayslipEmployerContributionsProps) {
  if (!employee.kiwisaver_enrolled) return null;

  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
        Employer Contributions
        <span className="ml-2 text-xs text-gray-400">(Not deducted from pay)</span>
      </h4>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">KiwiSaver (3%)</span>
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(calculations.employerKiwiSaver)}
        </span>
      </div>
    </div>
  );
}