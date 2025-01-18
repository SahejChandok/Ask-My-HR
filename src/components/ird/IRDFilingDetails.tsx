import React from 'react';
import { X, Download } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { IRDFiling } from '../../types/ird';

interface IRDFilingDetailsProps {
  filing: IRDFiling;
  onClose: () => void;
}

export function IRDFilingDetails({ filing, onClose }: IRDFilingDetailsProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              IRD Filing Details
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {formatDisplayDate(filing.period_start)} - {formatDisplayDate(filing.period_end)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {/* TODO: Implement export */}}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Total PAYE</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(filing.response_data?.header.total_paye || 0)}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Total Gross</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(filing.response_data?.header.total_gross || 0)}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">Employees</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {filing.response_data?.header.employee_count || 0}
              </dd>
            </div>
          </div>

          {/* Employee Details */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Employee Details</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IRD Number
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Code
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAYE
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KiwiSaver
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filing.response_data?.employees.map((employee, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.ird_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {employee.tax_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(employee.gross_earnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(employee.paye_deducted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(employee.kiwisaver_deductions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}