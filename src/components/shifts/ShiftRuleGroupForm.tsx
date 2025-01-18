import React, { useState } from 'react';
import { Clock, DollarSign, AlertTriangle, Save } from 'lucide-react';
import { TenantShiftConfig } from '../../types/shift';
import { IndustryTemplateSelect } from './IndustryTemplateSelect';
import { getIndustryTemplate } from '../../utils/shiftTemplates';

interface ShiftRuleGroupFormProps {
  group?: TenantShiftConfig;
  onSave: (config: Partial<TenantShiftConfig>) => Promise<void>;
  onCancel: () => void;
}

export function ShiftRuleGroupForm({ group, onSave, onCancel }: ShiftRuleGroupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState({
    name: group?.name || '',
    location: group?.location || 'all',
    timeRules: group?.timeRules || {
      standardHours: {
        daily: 8,
        weekly: 40,
        fortnightly: 80
      },
      breakRules: {
        minimumBreak: 30,
        paidBreak: false,
        breakFrequency: 4,
        maxWorkBeforeBreak: 5
      },
      overtimeThresholds: {
        daily: 8,
        weekly: 40,
        fortnightly: 80
      }
    },
    rateMultipliers: group?.rateMultipliers || {
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
        loadingAllowance: 25.00,
        mealAllowance: 15.00,
        startTime: "22:00",
        endTime: "06:00"
      }
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Rule group name is required');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await onSave(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save rule group');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        {/* Basic Info */}
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rule Group Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Standard Shifts"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be unique for the selected location
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All Locations</option>
                <option value="auckland">Auckland</option>
                <option value="wellington">Wellington</option>
                <option value="christchurch">Christchurch</option>
                <option value="hamilton">Hamilton</option>
                <option value="tauranga">Tauranga</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Rules can be location-specific or apply to all locations
              </p>
            </div>
          </div>
        </div>

        {/* Time Rules */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Time Rules</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fortnightly Hours
              </label>
              <input
                type="number"
                min="1"
                max="336"
                value={formData.timeRules.standardHours.fortnightly}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  timeRules: {
                    ...prev.timeRules,
                    standardHours: {
                      ...prev.timeRules.standardHours,
                      fortnightly: parseInt(e.target.value)
                    }
                  }
                }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Break Rules */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Break Rules</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Break (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.timeRules.breakRules.minimumBreak}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timeRules: {
                      ...prev.timeRules,
                      breakRules: {
                        ...prev.timeRules.breakRules,
                        minimumBreak: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={formData.timeRules.breakRules.paidBreak}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      timeRules: {
                        ...prev.timeRules,
                        breakRules: {
                          ...prev.timeRules.breakRules,
                          paidBreak: e.target.checked
                        }
                      }
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Paid Breaks</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Multipliers */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Rate Multipliers</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Night Shift Rate
              </label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.01"
                value={formData.rateMultipliers.nightShift.rate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  rateMultipliers: {
                    ...prev.rateMultipliers,
                    nightShift: {
                      ...prev.rateMultipliers.nightShift,
                      rate: parseFloat(e.target.value)
                    }
                  }
                }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter rate with up to 2 decimal places (e.g. 1.15)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Rule Group
        </button>
      </div>
    </form>
  );
}