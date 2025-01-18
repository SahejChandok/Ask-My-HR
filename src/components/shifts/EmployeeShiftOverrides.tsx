import React, { useState } from 'react';
import { Clock, AlertTriangle, Save } from 'lucide-react';
import { EmployeeShiftOverrides as EmployeeOverrides } from '../../types/shift';

interface EmployeeShiftOverridesProps {
  employeeId: string;
  overrides?: EmployeeOverrides;
  onSave: (overrides: Partial<EmployeeOverrides>) => Promise<void>;
}

export function EmployeeShiftOverrides({ employeeId, overrides, onSave }: EmployeeShiftOverridesProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState({
    standardHours: overrides?.standardHours || {
      daily: undefined,
      weekly: undefined,
      monthly: undefined
    },
    restrictions: overrides?.restrictions || {
      maxHours: undefined,
      excludedShifts: [],
      requiredBreaks: []
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      await onSave(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save overrides');
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
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Hours Override</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Daily Hours Limit
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.standardHours.daily || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                standardHours: {
                  ...prev.standardHours,
                  daily: e.target.value ? parseInt(e.target.value) : undefined
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Default"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weekly Hours Limit
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={formData.standardHours.weekly || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                standardHours: {
                  ...prev.standardHours,
                  weekly: e.target.value ? parseInt(e.target.value) : undefined
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Default"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Hours
            </label>
            <input
              type="number"
              min="1"
              value={formData.restrictions.maxHours || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                restrictions: {
                  ...prev.restrictions,
                  maxHours: e.target.value ? parseInt(e.target.value) : undefined
                }
              }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Default"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Excluded Shift Types
          </label>
          <div className="mt-2 space-y-2">
            {['night', 'weekend', 'public_holiday'].map(shiftType => (
              <label key={shiftType} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={formData.restrictions.excludedShifts.includes(shiftType)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    restrictions: {
                      ...prev.restrictions,
                      excludedShifts: e.target.checked
                        ? [...prev.restrictions.excludedShifts, shiftType]
                        : prev.restrictions.excludedShifts.filter(t => t !== shiftType)
                    }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {shiftType.replace('_', ' ').charAt(0).toUpperCase() + shiftType.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Overrides
        </button>
      </div>
    </form>
  );
}