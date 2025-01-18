import React from 'react';
import { FileText } from 'lucide-react';
import { PayrollResultData } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface PayslipViewProps {
  result: PayrollResultData;
  periodStart: string;
  periodEnd: string;
  onExport: (format: 'pdf' | 'csv') => void;
}

export function PayslipView({ result, periodStart, periodEnd, onExport }: PayslipViewProps) {
  const { employee, calculations } = result;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payslip</h3>
          <p className="text-sm text-gray-500">
            {formatDisplayDate(periodStart)} - {formatDisplayDate(periodEnd)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onExport('pdf')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => onExport('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Employee Details */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Details</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {employee.first_name} {employee.last_name}
                </p>
                <p className="text-sm text-gray-500">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tax Code</p>
                <p className="text-sm font-medium text-gray-900">{employee.tax_code}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Employment Details</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Employment Type</p>
                <p className="text-sm font-medium text-gray-900">
                  {employee.employment_type === 'salary' ? 'Salaried' : 'Hourly'} Employee
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">KiwiSaver Status</p>
                {employee.kiwisaver_enrolled ? (
                  <p className="text-sm font-medium text-gray-900">
                    Enrolled ({employee.kiwisaver_rate}% contribution)
                  </p>
                ) : (
                  <p className="text-sm font-medium text-gray-500">Not enrolled</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Earnings & Deductions</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">Gross Earnings</h5>
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gross Pay</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(calculations.grossPay)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">Deductions</h5>
              <div className="bg-gray-50 rounded-md p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">PAYE Tax</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(calculations.payeTax)}
                  </span>
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
                      {formatCurrency(calculations.payeTax + calculations.kiwiSaverDeduction)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-700">Net Pay</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(calculations.netPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p>* This payslip contains all required information as per NZ Employment Relations Act 2000</p>
            <p>* Please retain this payslip for your tax records</p>
          </div>
        </div>
      </div>
    </div>
  );
}