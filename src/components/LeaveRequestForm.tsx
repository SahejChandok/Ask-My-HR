import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LeaveBalance, LeaveType } from '../types';
import { X, Users, AlertCircle } from 'lucide-react';
import { EmployeeSelect } from './EmployeeSelect';
import { calculateLeaveHours } from '../utils/leaveCalculations';

interface LeaveRequestFormProps {
  onClose: () => void;
  onSubmit: () => void;
  balances: LeaveBalance[];
}

export function LeaveRequestForm({
  onClose,
  onSubmit,
  balances,
}: LeaveRequestFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formData, setFormData] = useState({
    leave_type: 'annual' as LeaveType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    // Calculate requested hours for the leave period
    const requestedHours = calculateLeaveHours({
      ...formData,
      employee_id: selectedEmployeeId || user.id,
      tenant_id: user.tenant_id || '',
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
    
    // Get available balance
    const balance = balances.find(b => b.leave_type === formData.leave_type);
    if (balance && requestedHours > balance.balance_hours) {
      setError(`Insufficient leave balance. Available: ${balance.balance_hours}h, Requested: ${requestedHours}h`);
      return;
    }

    if (!user?.tenant_id) return;

    const employeeId = selectedEmployeeId || user.id;

    try {
      setLoading(true);

      // Get employee profile
      const { data: profiles, error: profileError } = await supabase
        .from('employee_profiles')
        .select()
        .eq('user_id', employeeId)
        .eq('tenant_id', user.tenant_id);

      if (profileError) throw profileError;
      const profile = profiles[0];

      // Create leave request
      const { error: requestError } = await supabase.from('leave_requests').insert({
        employee_id: profile.id,
        tenant_id: profile.tenant_id,
        ...formData,
        status: 'pending',
      });

      if (requestError) throw requestError;

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting leave request:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Request Leave
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {['platform_admin', 'tenant_admin', 'hr_manager'].includes(user?.role || '') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee
                </label>
                <div className="mt-1 flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-2" />
                  <EmployeeSelect
                    value={selectedEmployeeId}
                    onChange={setSelectedEmployeeId}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <select
                value={formData.leave_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    leave_type: e.target.value as LeaveType,
                  })
                }
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="bereavement">Bereavement Leave</option>
                <option value="public_holiday">Public Holiday</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {formData.leave_type === 'annual' && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  Available Annual Leave:{' '}
                  {balances.find((b) => b.leave_type === 'annual')?.balance_hours ||
                    0}{' '}
                  hours
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}