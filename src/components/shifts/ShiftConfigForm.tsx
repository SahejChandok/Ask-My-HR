import React, { useState } from 'react';
import { Settings, Clock, DollarSign, FileText } from 'lucide-react';
import { TenantShiftConfig } from '../../types/shift';

interface ShiftConfigFormProps {
  config?: TenantShiftConfig;
  onSave: (config: Partial<TenantShiftConfig>) => Promise<void>;
}

export function ShiftConfigForm({ config, onSave }: ShiftConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState({
    timeRules: config?.timeRules || {
      standardHours: {
        daily: 8,
        weekly: 40
      },
      breakRules: {
        minimumBreak: 30,
        paidBreak: false,
        breakFrequency: 4,
        maxWorkBeforeBreak: 5
      },
      overtimeThresholds: {
        daily: 8,
        weekly: 40
      }
    },
    rateMultipliers: config?.rateMultipliers || {
      overtime: {
        rate1: 1.5,
        rate2: 2.0,
        threshold: 4
      },
      weekend: {
        saturday: 1.25,
        sunday: 1.5
      },
      publicHoliday: {
        rate: 2.0,
        alternativeHoliday: true
      },
      nightShift: {
        rate: 1.15,
        startTime: "22:00",
        endTime: "06:00"
      }
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      await onSave(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Time Rules Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Time Rules</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Daily Standard Hours
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.timeRules.standardHours.daily}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                timeRules: {
                  ...prev.timeRules,
                  standardHours: {
                    ...prev.timeRules.standardHours,
                    daily: parseInt(e.target.value)
                  }
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weekly Standard Hours
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={formData.timeRules.standardHours.weekly}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                timeRules: {
                  ...prev.timeRules,
                  standardHours: {
                    ...prev.timeRules.standardHours,
                    weekly: parseInt(e.target.value)
                  }
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Rate Multipliers Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Rate Multipliers</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Overtime Rate (First Tier)
            </label>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={formData.rateMultipliers.overtime.rate1}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rateMultipliers: {
                  ...prev.rateMultipliers,
                  overtime: {
                    ...prev.rateMultipliers.overtime,
                    rate1: parseFloat(e.target.value)
                  }
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Public Holiday Rate
            </label>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={formData.rateMultipliers.publicHoliday.rate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rateMultipliers: {
                  ...prev.rateMultipliers,
                  publicHoliday: {
                    ...prev.rateMultipliers.publicHoliday,
                    rate: parseFloat(e.target.value)
                  }
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Configuration
        </button>
      </div>
    </form>
  );
}