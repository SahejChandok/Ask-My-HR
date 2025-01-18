import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { IRDFilingConfig } from '../../components/ird/IRDFilingConfig';
import { IRDFilingHistory } from '../../components/ird/IRDFilingHistory';
import { IRDFilingDetails } from '../../components/ird/IRDFilingDetails';
import { IRDFilingStatus } from '../../components/ird/IRDFilingStatus';
import { Loader2, AlertTriangle } from 'lucide-react';
import { isDevelopment } from '../../utils/environment';

export function IRDFiling() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<any>();
  const [filings, setFilings] = useState<any[]>([]);
  const [selectedFiling, setSelectedFiling] = useState<any>();

  useEffect(() => {
    loadData();
  }, [user?.tenant_id]);

  async function loadData() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      // Load IRD config
      const { data: configData, error: configError } = await supabase
        .from('ird_filing_config')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (configError) throw configError;
      setConfig(configData);

      // Load filing status
      const { data: statusData, error: statusError } = await supabase
        .rpc('check_filing_status', { p_tenant_id: user.tenant_id });

      if (statusError) throw statusError;
      setStatus(statusData);

      // Load filing history
      const { data: filingsData, error: filingsError } = await supabase
        .from('ird_filings')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('period_start', { ascending: false });

      if (filingsError) throw filingsError;
      setFilings(filingsData || []);

    } catch (error) {
      console.error('Error loading IRD data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load IRD filing data');
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
            {isDevelopment() && (
              <p className="mt-1 text-sm">Development mode is active. Role and tenant validation can be bypassed.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">IRD Filing</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <IRDFilingConfig />
        </div>

        {status && (
          <div>
            <IRDFilingStatus
              nextDueDate={status.nextDueDate}
              lastFilingDate={status.lastFilingDate}
              filingFrequency={status.filingFrequency}
              pendingFilings={status.pendingFilings}
            />
          </div>
        )}
      </div>
      
      <IRDFilingHistory 
        filings={filings}
        onViewDetails={setSelectedFiling}
      />

      {selectedFiling && (
        <IRDFilingDetails
          filing={selectedFiling}
          onClose={() => setSelectedFiling(undefined)}
        />
      )}
    </div>
  );
}