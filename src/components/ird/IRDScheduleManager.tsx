import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateIRDConfig } from '../../services/irdService';
import { IRDFilingFrequency } from '../../types/ird';

interface IRDScheduleManagerProps {
  frequency: IRDFilingFrequency;
  onUpdate: () => void;
}

export function IRDScheduleManager({ frequency, onUpdate }: IRDScheduleManagerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedFrequency, setSelectedFrequency] = useState<IRDFilingFrequency>(frequency);
  const [payDays, setPayDays] = useState<string[]>([]);

  const frequencyOptions = [
    { value: 'payday', label: 'Payday Filing (Within 2 working days)', description: 'File returns each payday' },
    { value: 'twice-monthly', label: 'Twice Monthly', description: 'File on the 15th and last day of each month' },
    { value: 'monthly', label: 'Monthly', description: 'File once per month by the 20th' }
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);

      const { success, error } = await updateIRDConfig(user.tenant_id, {
        filing_frequency: selectedFrequency,
        pay_days: payDays
      });

      if (!success) {
        throw new Error(error);
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError(error instanceof Error ? error.message : 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Calendar className="w-6 h-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-medium text-gray-900">Filing Schedule</h3>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Filing Frequency
          </label>
          <div className="mt-2 space-y-4">
            {frequencyOptions.map(option => (
              <div key={option.value} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={selectedFrequency === option.value}
                    onChange={() => setSelectedFrequency(option.value as IRDFilingFrequency)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedFrequency === 'payday' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Clock className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Payday Filing Requirements
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>File employment information within 2 working days of each payday</li>
                    <li>Submit returns even if no payments were made</li>
                    <li>File nil returns by the 15th of the following month</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Schedule
          </button>
        </div>
      </form>
    </div>
  );
}