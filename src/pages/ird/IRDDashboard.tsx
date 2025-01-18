import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { IRDFilingConfig } from '../../components/ird/IRDFilingConfig';
import { IRDFilingStatus } from '../../components/ird/IRDFilingStatus'; 
import { getFilingStatus } from '../../services/irdService';
import { Loader2, AlertTriangle } from 'lucide-react';
import { IRDFilingStatusData } from '../../types/ird';

export function IRDDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<IRDFilingStatusData>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadStatus();
  }, [user?.tenant_id]);

  async function loadStatus() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);
      const filingStatus = await getFilingStatus(user.tenant_id);
      setStatus(filingStatus);
    } catch (error) {
      console.error('Error loading IRD status:', error);
      setError('Failed to load IRD filing status');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-md flex items-center max-w-lg">
          <AlertTriangle className="w-6 h-6 mr-3" />
          <div>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">IRD Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {status && (
          <IRDFilingStatus
            nextDueDate={status.nextDueDate}
            lastFilingDate={status.lastFilingDate}
            filingFrequency={status.filingFrequency || 'payday'}
            pendingFilings={status.pendingFilings}
          />
        )}
        <IRDFilingConfig onUpdate={loadStatus} />
      </div>
    </div>
  );
}