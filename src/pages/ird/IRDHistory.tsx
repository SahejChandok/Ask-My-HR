import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { IRDFilingHistory } from '../../components/ird/IRDFilingHistory';
import { IRDFilingDetails } from '../../components/ird/IRDFilingDetails';
import { Loader2 } from 'lucide-react';

export function IRDHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filings, setFilings] = useState<any[]>([]);
  const [selectedFiling, setSelectedFiling] = useState<any>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadFilings();
  }, [user?.tenant_id]);

  async function loadFilings() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      const { data, error: filingsError } = await supabase
        .from('ird_filings')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('period_start', { ascending: false });

      if (filingsError) throw filingsError;
      setFilings(data || []);

    } catch (error) {
      console.error('Error loading IRD filings:', error);
      setError('Failed to load filing history');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Filing History</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

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