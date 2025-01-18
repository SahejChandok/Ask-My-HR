import React from 'react';
import { Download, FileDown } from 'lucide-react';
import { formatDisplayDate } from '../../../utils/dateUtils';

interface PayslipHeaderProps {
  periodStart: string;
  periodEnd: string;
  onExport: (format: 'pdf' | 'csv') => void;
}

export function PayslipHeader({ periodStart, periodEnd, onExport }: PayslipHeaderProps) {
  return (
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
          <Download className="h-4 w-4 mr-2" />
          PDF
        </button>
        <button
          onClick={() => onExport('csv')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FileDown className="h-4 w-4 mr-2" />
          CSV
        </button>
      </div>
    </div>
  );
}