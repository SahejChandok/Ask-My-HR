import React from 'react';
import { PayrollResultData } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { DollarSign, Clock } from 'lucide-react';

interface PayslipSummaryProps {
  calculations: PayrollResultData['calculations'];
  ytdTotals?: {
    earnings: {
      gross: number;
      taxable: number;
      leave: number;
    };
    deductions: {
      paye: number;
      acc: number;
      kiwisaver: number;
      total: number;
    };
  };
}

export function PayslipSummary({ calculations, ytdTotals }: PayslipSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Net Pay */}
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-gray-50 rounded-md p-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-700 flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Net Pay
            </span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(calculations.netPay)}
            </span>
          </div>
        </div>
      </div>

      {/* YTD Summary */}
      {ytdTotals && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Year to Date Summary</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-600 mb-1">Gross Earnings</p>
              <p className="text-lg font-medium text-gray-900">
                {formatCurrency(ytdTotals.earnings.gross)}
                {ytdTotals.earnings.leave > 0 && (
                  <span className="block text-xs text-gray-500">
                    Including {formatCurrency(ytdTotals.earnings.leave)} leave pay
                  </span>
                )}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-600 mb-1">Total Tax</p>
              <p className="text-lg font-medium text-gray-900">
                {formatCurrency(ytdTotals.deductions.paye)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-600 mb-1">Total ACC</p>
              <p className="text-lg font-medium text-gray-900">
                {ytdTotals.deductions.acc > 0 ? (
                  formatCurrency(ytdTotals.deductions.acc)
                ) : (
                  <span className="text-sm text-gray-500">Not applicable</span>
                )}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-600 mb-1">Total KiwiSaver</p>
              <p className="text-lg font-medium text-gray-900">
                {formatCurrency(ytdTotals.deductions.kiwisaver)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p>* This payslip contains all required information as per NZ Employment Relations Act 2000</p>
          <p>* Please retain this payslip for your tax records</p>
          <p>* Contact payroll@company.com if you have any questions about this payslip</p>
        </div>
      </div>
    </div>
  );
}