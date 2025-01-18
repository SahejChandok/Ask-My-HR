import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { checkFilingStatus } from '../../services/irdIntegration';
import { IRDFiling } from '../../types/ird';
import { formatDisplayDate } from '../../utils/dateUtils';

interface IRDFilingMonitorProps {
  filingId: string;
  onStatusChange?: (status: string) => void;
}

export function IRDFilingMonitor({ filingId, onStatusChange }: IRDFilingMonitorProps) {
  const [filing, setFiling] = useState<IRDFiling | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function checkStatus() {
      try {
        setLoading(true);
        const result = await checkFilingStatus(filingId);
        
        if (result) {
          setFiling(result);
          onStatusChange?.(result.status);

          // Stop polling if we reach a final state
          if (['accepted', 'rejected'].includes(result.status)) {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error checking filing status:', error);
        setError(error instanceof Error ? error.message : 'Failed to check status');
      } finally {
        setLoading(false);
      }
    }

    // Check immediately
    checkStatus();

    // Poll every 30 seconds if not in final state
    if (!['accepted', 'rejected'].includes(filing?.status || '')) {
      interval = setInterval(checkStatus, 30000);
    }

    return () => clearInterval(interval);
  }, [filingId]);

  if (!filing) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filing Status</h3>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Status</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            filing.status === 'accepted' ? 'bg-green-100 text-green-800' :
            filing.status === 'rejected' ? 'bg-red-100 text-red-800' :
            filing.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {filing.status === 'accepted' && <CheckCircle className="w-4 h-4 mr-1" />}
            {filing.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
            {filing.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
            {filing.status === 'submitted' && <AlertTriangle className="w-4 h-4 mr-1" />}
            {filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
          </span>
        </div>

        {filing.submission_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Submitted</span>
            <span className="text-sm text-gray-900">
              {formatDisplayDate(filing.submission_date)}
            </span>
          </div>
        )}

        {filing.error_details && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Filing Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{filing.error_details.message}</p>
                  {filing.error_details.details && (
                    <p className="mt-1 text-sm">{filing.error_details.details}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Status Check Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}