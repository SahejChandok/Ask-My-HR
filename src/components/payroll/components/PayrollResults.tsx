import React from 'react';
import { PayrollResultData } from '../../../types';
import { formatDisplayDate } from '../../../utils/dateUtils';

interface PayrollResultsProps {
  results: PayrollResultData[];
  periodStart: string;
  periodEnd: string;
}

export function PayrollResults({ results, periodStart, periodEnd }: PayrollResultsProps) {
  if (!results || results.length === 0) return null;

  const totals = results.reduce(
    (acc, { calculations }) => ({
      gross: Number((acc.gross + (calculations?.grossPay || 0)).toFixed(2)),
      kiwisaver: Number((acc.kiwisaver + (calculations?.kiwiSaverDeduction || 0)).toFixed(2)),
      paye: Number((acc.paye + (calculations?.payeTax || 0)).toFixed(2)),
      net: Number((acc.net + (calculations?.netPay || 0)).toFixed(2)),
    }),
    { gross: 0, kiwisaver: 0, paye: 0, net: 0 }
  );

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Payroll Results
      </h3>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payroll Summary: {formatDisplayDate(periodStart)} - {formatDisplayDate(periodEnd)}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {results.length} employee{results.length !== 1 ? 's' : ''} processed
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
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
                KiwiSaver
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                PAYE
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Pay
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map(({ employee, calculations }) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.first_name} {employee.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.email}
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
                  ${calculations.kiwiSaverDeduction.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  ${calculations.payeTax.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  ${calculations.netPay.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-medium">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Total ({results.length} employees)
              </td>
              <td colSpan={3} />
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.gross.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.kiwisaver.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.paye.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                ${totals.net.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}