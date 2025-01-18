import React from 'react';
import { PayrollResultData } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { Clock } from 'lucide-react';

interface PayslipDeductionsProps {
  calculations: PayrollResultData['calculations'];
  employee: PayrollResultData['employee'];
}

export function PayslipDeductions({ calculations, employee }: PayslipDeductionsProps) {
  const totalDeductions = calculations.payeTax + 
    calculations.accLevy +
    calculations.kiwiSaverDeduction;

  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Earnings & Deductions</h4>
      
      <div className="space-y-4">
        {/* Gross Pay */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Gross Pay
            {calculations.leaveDetails && (
              <span className="text-xs text-gray-500 ml-1">
                (Including {calculations.leaveDetails.hours}h leave)
              </span>
            )}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(calculations.grossPay)}
          </span>
        </div>

        {/* Leave Details */}
        {calculations.leaveDetails && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">
              {calculations.leaveDetails.type} Leave ({calculations.leaveDetails.hours}h)
            </span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(calculations.leaveDetails.amount)}
              </span>
              <p className="text-xs text-gray-500">
                {calculations.leaveDetails.dates.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* PAYE Tax */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">PAYE Tax</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(calculations.payeTax)}
          </span>
        </div>

        {/* ACC Levy */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">ACC Levy</span>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(calculations.accLevy)}
            </span>
            {calculations.accLevyDetails && (
              <p className="text-xs text-gray-500">
                YTD: {formatCurrency(calculations.accLevyDetails.ytdEarnings)}
                {calculations.accLevyDetails.remainingCap > 0 && (
                  <span className="ml-1">
                    (Cap: {formatCurrency(calculations.accLevyDetails.remainingCap)})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {employee.kiwisaver_enrolled && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">
              KiwiSaver ({employee.kiwisaver_rate}%)
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(calculations.kiwiSaverDeduction)}
            </span>
          </div>
        )}

        <div className="pt-2 mt-2 border-t border-gray-200">
          <div className="flex justify-between font-medium">
            <span className="text-sm text-gray-700">Total Deductions</span>
            <span className="text-sm text-gray-900">
              {formatCurrency(
                calculations.payeTax +
                calculations.accLevy +
                calculations.kiwiSaverDeduction
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}