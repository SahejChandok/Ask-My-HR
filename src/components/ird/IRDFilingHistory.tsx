import React from 'react';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { IRDFiling } from '../../types/ird';

interface IRDFilingHistoryProps {
  filings: IRDFiling[];
  onViewDetails: (filing: IRDFiling) => void;
}

export function IRDFilingHistory({ filings, onViewDetails }: IRDFilingHistoryProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">IRD Filing History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total PAYE
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Gross
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filings.map((filing) => (
              <tr key={filing.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDisplayDate(filing.period_start)} - {formatDisplayDate(filing.period_end)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {filing.filing_type.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(filing.response_data?.header.total_paye || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(filing.response_data?.header.total_gross || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    filing.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    filing.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    filing.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {filing.status === 'accepted' && <CheckCircle className="w-4 h-4 mr-1" />}
                    {filing.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                    {filing.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                    {filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onViewDetails(filing)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {filings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No filings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}