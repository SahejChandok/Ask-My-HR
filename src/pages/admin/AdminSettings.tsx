import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Settings, AlertTriangle, Loader2, Save } from 'lucide-react';

export function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [settings, setSettings] = useState({
    companyName: '',
    timezone: '',
    dateFormat: '',
    emailNotifications: true
  });

  useEffect(() => {
    loadSettings();
  }, [user?.tenant_id]);

  async function loadSettings() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    try {
      setSaving(true);
      setError(undefined);

      const { error } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: user.tenant_id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-6 gap-6">
            <div className="col-span-6 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings(s => ({ ...s, companyName: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(s => ({ ...s, timezone: e.target.value }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="Pacific/Auckland">Pacific/Auckland</option>
                <option value="Pacific/Chatham">Pacific/Chatham</option>
              </select>
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Date Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings(s => ({ ...s, dateFormat: e.target.value }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="col-span-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings(s => ({ ...s, emailNotifications: e.target.checked }))}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-gray-500">
                    Receive email notifications for important events
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}