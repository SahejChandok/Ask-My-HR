import React, { useState } from 'react';
import { AlertTriangle, Clock, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateIRDConfig } from '../../services/irdService';

interface IRDAutoFilingConfigProps {
  enabled: boolean;
  daysAfter: number;
  onUpdate: () => void;
}

export function IRDAutoFilingConfig({
  enabled,
  daysAfter,
  onUpdate
}: IRDAutoFilingConfigProps) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [days, setDays] = useState(daysAfter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      const { success, error } = await updateIRDConfig(user.tenant_id, {
        auto_file: isEnabled,
        file_on_day: days
      });

      if (!success) {
        throw new Error(error);
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating auto-filing config:', error);
      setError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Auto-Filing Configuration</h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable automatic filing
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Automatically submit IRD filings after each pay run
          </p>
        </div>

        {isEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              File after (days)
            </label>
            <div className="mt-1 flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="number"
                min="1"
                max="5"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <span className="ml-2 text-sm text-gray-500">days after pay day</span>
            </div>
            {days > 2 && (
              <div className="mt-2 flex items-start text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                <p>IRD requires filing within 2 working days of each payday</p>
              </div>
            )}
          </div>
        )}

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
  );
}