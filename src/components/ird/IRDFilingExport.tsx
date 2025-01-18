import React, { useState } from 'react';
import { Download, FileDown, Loader2, AlertTriangle } from 'lucide-react';
import { IRDFiling } from '../../types/ird';
import { formatDisplayDate } from '../../utils/dateUtils';
import { generateIRDFilingPDF, generateIRDFilingCSV } from '../../utils/irdExport';

interface IRDFilingExportProps {
  filing: IRDFiling;
}

export function IRDFilingExport({ filing }: IRDFilingExportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleExport(format: 'csv' | 'pdf') {
    setLoading(true);
    setError(undefined);

    try {
      const filename = `ird-filing-${filing.filing_type}-${formatDisplayDate(filing.period_start)}`;
      
      let blob: Blob;
      if (format === 'pdf') {
        blob = generateIRDFilingPDF(filing);
      } else {
        const csvContent = generateIRDFilingCSV(filing);
        blob = new Blob([csvContent], { type: 'text/csv' });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting filing:', error);
      setError(error instanceof Error ? error.message : 'Failed to export filing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          Export CSV
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export PDF
        </button>
      </div>
    </div>
  );
}