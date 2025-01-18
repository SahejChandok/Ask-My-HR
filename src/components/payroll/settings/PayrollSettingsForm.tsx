import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { PayrollSettings } from '../../../types';
import { Loader2 } from 'lucide-react';

interface PayrollSettingsFormProps {
  settings: PayrollSettings;
  onUpdate: () => void;
}

export function PayrollSettingsForm({ settings, onUpdate }: PayrollSettingsFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pay_period_type: settings.pay_period_type,
    pay_day: settings.pay_day,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('payroll_settings')
        .update({
          pay_period_type: formData.pay_period_type,
          pay_day: formData.pay_day,
        })
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating payroll settings:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pay Period Type
        </label>
        <select
          value={formData.pay_period_type}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            pay_period_type: e.target.value as PayrollSettings['pay_period_type']
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
  );
}