import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';
import { getIRDConfig, saveIRDConfig } from '../../services/irdService';
import { IRDConfig } from '../../types/ird';

export function IRDScheduleConfig() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState<Partial<IRDConfig>>({
    filing_frequency: 'payday',
    auto_file: true,
    file_on_day: 2
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

      // Set form data using existing config or defaults
      setFormData({
        filing_frequency: existingConfig?.filing_frequency || 'payday',
        auto_file: existingConfig?.auto_file ?? false,
        file_on_day: existingConfig?.file_on_day ?? 2
      });

    } catch (error) {
      console.error('Error loading IRD schedule:', error);
      setError('Failed to load IRD schedule configuration');
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
      const { success, error: saveError } = await saveIRDConfig(user.tenant_id, formData);

      if (!success) {
        throw new Error(saveError || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving IRD schedule:', error);
      setError(error instanceof Error ? error.message : 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Filing Schedule</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Filing Frequency
          </label>
          <select
            value={formData.filing_frequency}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              filing_frequency: e.target.value as IRDConfig['filing_frequency']
            }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="monthly">Monthly</option>
            <option value="twice-monthly">Twice Monthly</option>
            <option value="payday">Payday Filing</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.filing_frequency === 'payday' 
              ? 'File within 2 working days of each payday'
              : formData.filing_frequency === 'twice-monthly'
              ? 'File on the 15th and last day of each month'
              : 'File once per month by the 20th'}
          </p>
        </div>

        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.auto_file}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                auto_file: e.target.checked
              }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable automatic filing
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Automatically submit IRD filings based on schedule
          </p>
        </div>

        {formData.auto_file && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              File after (days)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.file_on_day}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                file_on_day: parseInt(e.target.value)
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of days after pay day to submit filing
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || loadingConfig}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Schedule
          </button>
        </div>
      </form>
    </div>
  );
}