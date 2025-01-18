import React from 'react';
import { PayrollResultData, PayrollCalculationLog } from '../../types';
import { PayrollDebug } from './PayrollDebug';
import { PayslipView } from './payslip/PayslipView';
import { generatePayslipPDF, generatePayslipCSV } from '../../utils/payslipGeneration';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { MINIMUM_WAGE } from '../../utils/tax/constants';

interface PayrollResultsProps {
  results: PayrollResultData[];
  periodStart: string;
  periodEnd: string;
  logs?: PayrollCalculationLog[];
  onEmployeeSelect?: (employeeId: string) => void;
  selectedEmployeeId?: string;
}

export function PayrollResults({ 
  results, 
  periodStart, 
  periodEnd,
  logs,
  onEmployeeSelect,
  selectedEmployeeId
}: PayrollResultsProps) {
  const totals = results.reduce(
    (acc, { calculations }) => ({
      gross: acc.gross + calculations.grossPay,
      kiwisaver: acc.kiwisaver + (calculations.kiwiSaverDeduction || 0),
      employerKiwisaver: acc.employerKiwisaver + (calculations.employerKiwiSaver || 0),
      paye: acc.paye + calculations.payeTax,
      net: acc.net + calculations.netPay,
    }),
    { gross: 0, kiwisaver: 0, employerKiwisaver: 0, paye: 0, net: 0 }
  );

  // Verify calculation completeness
  const verifyCalculations = (result: PayrollResultData) => {
    const employeeLogs = logs?.filter(log => log.employee_id === result.employee.id) || [];
    return {
      hasTimesheet: employeeLogs.some(log => log.log_type === 'timesheet_summary'),
      hasTax: employeeLogs.some(log => log.log_type === 'tax_calculation'),
      hasFinal: employeeLogs.some(log => log.log_type === 'final_calculation')
    };
  };

  function handleExport(result: PayrollResultData, format: 'pdf' | 'csv') {
    const filename = `payslip-${result.employee.last_name}-${periodStart}`;
    
    if (format === 'csv') {
      const csv = generatePayslipCSV(result, periodStart, periodEnd);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = generatePayslipPDF(result, periodStart, periodEnd);
      const url = URL.createObjectURL(blob);
      window.open(url);
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              Payroll Summary
              {results.some(r => !r.calculations.minimumWageCheck?.compliant) && (
                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  Minimum Wage Alert
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {formatDisplayDate(periodStart)} - {formatDisplayDate(periodEnd)}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {results.length} employees processed
          </div>
        </div>
        {results.length >= 50 && (
          <div className="mt-2 text-sm text-gray-500">
            Large payroll run - calculations may take a few moments
          </div>
        )}
      </div>

      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6"> 
              <dt className="text-sm font-medium text-gray-500 truncate">Total Gross Pay</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatCurrency(totals.gross)}
              </dd>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Deductions
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatCurrency(totals.paye + totals.kiwisaver)}
              </dd>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>PAYE:</span>
                  <span>{formatCurrency(totals.paye)}</span>
                </div>
                <div className="flex justify-between">
                  <span>KiwiSaver:</span>
                  <span>{formatCurrency(totals.kiwisaver)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Net Pay</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatCurrency(totals.net)}
              </dd>
            </div>
          </div>
        </div>

        {/* Employee Details */}
        {selectedEmployeeId && logs && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Employee Details</h3>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <EmployeePayrollDetail
                  result={results.find(r => r.employee.id === selectedEmployeeId)!}
                  logs={logs.filter(log => log.employee_id === selectedEmployeeId)}
                  periodStart={periodStart}
                  periodEnd={periodEnd}
                />
              </div>
            </div>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Code
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                KiwiSaver
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross Pay
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                PAYE
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                KiwiSaver
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Pay
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map(({ employee, calculations }) => {
              const { hasTimesheet, hasTax, hasFinal } = verifyCalculations({ employee, calculations });
              const isComplete = hasTimesheet && hasTax && hasFinal;
              
              return (
                <tr 
                  key={employee.id}
                  onClick={() => onEmployeeSelect?.(employee.id)}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedEmployeeId === employee.id ? 'bg-indigo-50' : ''
                  } ${!isComplete ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.first_name} {employee.last_name}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEmployeeSelect?.(employee.id);
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                    {!isComplete && (
                      <span className="ml-2 text-xs text-yellow-600">
                        (Incomplete data)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {employee.tax_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {employee.kiwisaver_enrolled ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {employee.kiwisaver_rate}%
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Not Enrolled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    ${calculations.grossPay.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    ${calculations.payeTax.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    ${(calculations.kiwiSaverDeduction || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    <div className="flex items-center justify-end">
                      ${(calculations.netPay || 0).toFixed(2)}
                      {!calculations.minimumWageCheck?.compliant && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Below Min Wage
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport({ employee, calculations }, 'pdf');
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-50 font-medium">
              <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Total ({results.length} employees)
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.gross.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.paye.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.kiwisaver.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.net.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
        {results.some(r => !r.calculations.minimumWageCheck?.compliant) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800">Minimum Wage Compliance Issues</h4>
            <p className="mt-1 text-sm text-red-600">
              Some employees are being paid below the minimum wage rate of ${MINIMUM_WAGE.ADULT}/hr.
              Please review and adjust their pay rates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}