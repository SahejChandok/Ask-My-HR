import React from 'react';
import { Download, FileDown } from 'lucide-react';
import { PayrollResultData } from '../../../types';
import { formatDisplayDate } from '../../../utils/dateUtils';
import { PayslipHeader } from './PayslipHeader';
import { PayslipDetails } from './PayslipDetails';
import { PayslipDeductions } from './PayslipDeductions';
import { PayslipEmployerContributions } from './PayslipEmployerContributions';
import { PayslipSummary } from './PayslipSummary';

interface PayslipViewProps {
  result: PayrollResultData;
  periodStart: string;
  periodEnd: string;
  onExport: (format: 'pdf' | 'csv') => void;
}

export function PayslipView({ 
  result, 
  periodStart, 
  periodEnd, 
  onExport 
}: PayslipViewProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <PayslipHeader
        periodStart={periodStart}
        periodEnd={periodEnd}
        onExport={onExport}
      />
      <div className="px-6 py-4 space-y-4">
        <PayslipDetails 
          employee={result.employee} 
          calculations={result.calculations}
        />
        <PayslipDeductions 
          calculations={result.calculations}
          employee={result.employee}
        />
        <PayslipEmployerContributions 
          calculations={result.calculations}
          employee={result.employee}
        />
        <PayslipSummary 
          calculations={result.calculations}
          ytdTotals={result.ytdTotals}
        />
      </div>
    </div>
  );
}