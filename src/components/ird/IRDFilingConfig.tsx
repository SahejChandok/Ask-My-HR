import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';
import { getIRDConfig, saveIRDConfig } from '../../services/irdService';
import { IRDConfig } from '../../types/ird';

interface IRDFilingConfigProps {
  onUpdate?: () => void;
  onError?: (error: string) => void;
}

export function IRDFilingConfig({ onUpdate, onError }: IRDFilingConfigProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState<IRDConfig>({
    id: '',
    tenant_id: user?.tenant_id || '',
    ird_number: '123456789', // Set default IRD number
    filing_frequency: 'payday',
    auto_file: false,
    file_on_day: 2,
    last_filing_date: null,
    created_at: '',
    updated_at: ''
  });

  useEffect(() => {
    loadConfig();
  }, [user?.tenant_id]);

  async function loadConfig() {
    if (!user?.tenant_id) return;

    try {
      setLoadingConfig(true);
      setError(undefined);

      const existingConfig = await getIRDConfig(user.tenant_id);

      if (existingConfig) {
        setFormData(existingConfig);
      } else {
        // Set default values for new config
        setFormData(prev => ({
          ...prev,
          tenant_id: user.tenant_id
        }));
      }

    } catch (error) {
      console.error('Error loading IRD config:', error);
      setError('Failed to load IRD configuration');
    } finally {
      setLoadingConfig(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;
    
    setLoading(true);
    setError(undefined);

    try {
      const { success, error } = await saveIRDConfig(user.tenant_id, formData);

      if (!success) {
        onError?.(error || 'Failed to save configuration');
        return;
      }
      onUpdate?.();

      onUpdate?.();
    } catch (error) {
      console.error('Error saving IRD config:', error);
      const message = error instanceof Error ? error.message : 'Failed to save configuration';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">IRD Filing Configuration</h2>

      {loadingConfig ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (<div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IRD Number
          </label>
          <input
            type="text"
            pattern="\d{8,9}"
            maxLength={9}
            required
            value={formData.ird_number}
            onChange={(e) => setFormData(prev => ({ ...prev, ird_number: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Filing Frequency
          </label>
          <select
            value={formData.filing_frequency}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              filing_frequency: e.target.value as IRDFilingConfig['filing_frequency']
            }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="monthly">Monthly</option>
            <option value="twice-monthly">Twice Monthly</option>
            <option value="payday">Payday Filing</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </button>
        </div>
      </form>
      </div>
      )}
    </div>
  );
}