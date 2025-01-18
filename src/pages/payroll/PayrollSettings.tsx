import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PayrollSettings as PayrollSettingsType } from '../../types';
import { Loader2, Settings } from 'lucide-react';

export function PayrollSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PayrollSettingsType>();
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState({
    pay_period_type: 'monthly' as PayrollSettingsType['pay_period_type'],
    pay_day: 1
  });

  useEffect(() => {
    loadSettings();
  }, [user?.tenant_id]);

  async function loadSettings() {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (error) throw error;
      setSettings(data);
      setFormData({
        pay_period_type: data.pay_period_type,
        pay_day: data.pay_day
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load payroll settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      const { error } = await supabase
        .from('payroll_settings')
        .update({
          pay_period_type: formData.pay_period_type,
          pay_day: formData.pay_day,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;
      await loadSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update payroll settings');
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <Settings className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Payroll Settings
            </h3>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pay Period Type
              </label>
              <select
                value={formData.pay_period_type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pay_period_type: e.target.value as PayrollSettingsType['pay_period_type']
                }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pay Day
              </label>
              <select
                value={formData.pay_day}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pay_day: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {formData.pay_period_type === 'monthly' ? (
                  Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))
                ) : (
                  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
                    <option key={i + 1} value={i + 1}>{day}</option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}