import React from 'react';
import { PayrollResultData, PayrollCalculationLog } from '../../types';
import { formatCurrency, formatHours } from '../../utils/formatters';
import { Clock, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import { MINIMUM_WAGE } from '../../utils/tax/constants';
import { formatDisplayDate } from '../../utils/dateUtils';

interface EmployeePayrollDetailProps {
  result: PayrollResultData;
  logs?: PayrollCalculationLog[];
  periodStart: string;
  periodEnd: string;
}

export function EmployeePayrollDetail({ result, logs, periodStart, periodEnd }: EmployeePayrollDetailProps) {
  const { employee, calculations } = result;

  // Get timesheet details from logs
  const timesheetLog = logs?.find(log => log.log_type === 'timesheet_summary');
  const hoursWorked = timesheetLog?.details.total_hours || 0;

  // Get leave details from logs
  const leaveLog = logs?.find(log => log.log_type === 'leave_calculation');
  const leaveHours = leaveLog?.details.hours || 0;

  // Get ACC details from logs
  const accLog = logs?.find(log => log.log_type === 'acc_calculation');

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-sm text-gray-500">{employee.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              calculations.minimumWageCheck?.compliant 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {calculations.minimumWageCheck?.compliant 
                ? 'Compliant'
                : 'Below Minimum Wage'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employment Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Employment Details</h4>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Employment Type</dt>
              <dd className="text-sm font-medium text-gray-900">
                {employee.employment_type === 'salary' ? 'Salaried' : 'Hourly'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Pay Rate</dt>
              <dd className="text-sm font-medium text-gray-900">
                {employee.employment_type === 'salary' 
                  ? `${formatCurrency(employee.hourly_rate * 2080)}/year`
                  : `${formatCurrency(employee.hourly_rate)}/hour`
                }
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Tax Code</dt>
              <dd className="text-sm font-medium text-gray-900">{employee.tax_code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">KiwiSaver</dt>
              <dd className="text-sm font-medium text-gray-900">
                {employee.kiwisaver_enrolled 
                  ? `${employee.kiwisaver_rate}%`
                  : 'Not Enrolled'
                }
              </dd>
            </div>
          </dl>
        </div>

        {/* Hours Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Hours Summary</h4>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Regular Hours</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatHours(hoursWorked - leaveHours)}
              </dd>
            </div>
            {calculations.leaveDetails && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Leave Hours</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatHours(leaveHours)}
                  <span className="text-xs text-gray-500 ml-1">
                    ({calculations.leaveDetails.type})
                  </span>
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Total Hours</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatHours(hoursWorked)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Pay Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Pay Details</h4>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Gross Pay</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(calculations.grossPay)}
              </dd>
            </div>
            {calculations.leaveDetails && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Leave Pay</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(calculations.leaveDetails.amount)}
                </dd>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-700">Total Gross</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(calculations.grossPay)}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Deductions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Deductions</h4>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">PAYE Tax</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(calculations.payeTax)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">ACC Levy</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(calculations.accLevy || 0)}
                {calculations.accLevyDetails && (
                  <div className="text-xs text-gray-500">
                    YTD: {formatCurrency(calculations.accLevyDetails.ytdEarnings)}
                    {accLog && (
                      <div>Rate: {(accLog.details.levy_rate * 100).toFixed(2)}%</div>
                    )}
                  </div>
                )}
              </dd>
            </div>
            {employee.kiwisaver_enrolled && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">KiwiSaver</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(calculations.kiwiSaverDeduction)}
                </dd>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-700">Total Deductions</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(
                    calculations.payeTax +
                    calculations.accLevy +
                    calculations.kiwiSaverDeduction
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Net Pay */}
        <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-medium text-gray-700">Net Pay</h4>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(calculations.netPay)}
            </span>
          </div>
        </div>

        {/* Calculation Details */}
        {logs && logs.length > 0 && (
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Calculation Details
            </h4>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white rounded p-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    {log.log_type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h5>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}