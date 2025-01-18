import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';
import { updateTenantSettings } from '../../services/adminService';

interface TenantSettingsProps {
  settings: {
    companyName: string;
    timezone: string;
    dateFormat: string;
    emailNotifications: boolean;
  };
  onUpdate: () => void;
}

export function TenantSettings({ settings, onUpdate }: TenantSettingsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState(settings);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      const { success, error } = await updateTenantSettings(user.tenant_id, formData);

      if (!success) {
        throw new Error(error);
      }

      onUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Tenant Settings</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="Pacific/Auckland">Pacific/Auckland</option>
            <option value="Pacific/Chatham">Pacific/Chatham</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date Format
          </label>
          <select
            value={formData.dateFormat}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFormat: e.target.value }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                emailNotifications: e.target.checked
              }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable email notifications
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Receive email notifications for important events
          </p>
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
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}