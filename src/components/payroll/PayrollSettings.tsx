import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PayrollSettings as PayrollSettingsType, PayPeriodType } from '../../types';
import { Settings, Loader2 } from 'lucide-react';

interface PayrollSettingsProps {
  settings: PayrollSettingsType;
  onUpdate: () => void;
}

export function PayrollSettings({ settings, onUpdate }: PayrollSettingsProps) {
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
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Payroll Settings
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pay Period Type
            </label>
            <select
              value={formData.pay_period_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pay_period_type: e.target.value as PayPeriodType,
                })
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {formData.pay_period_type === 'monthly'
                ? 'Pay Day of Month'
                : 'Pay Day of Week'}
            </label>
            <select
              value={formData.pay_day}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pay_day: parseInt(e.target.value),
                })
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {formData.pay_period_type === 'monthly'
                ? Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))
                : Array.from({ length: 7 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}
                    </option>
                  ))}
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
  );
}