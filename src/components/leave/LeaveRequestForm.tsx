import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveBalance, LeaveType } from '../../types';
import { X, Users, AlertCircle, Loader2 } from 'lucide-react';
import { EmployeeSelect } from '../EmployeeSelect';
import { validateLeaveRequest } from '../../utils/leaveValidation';
import { createLeaveRequest } from '../../services/leaveService';
import { formatDisplayDate } from '../../utils/dateUtils';

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
  const [currentBalance, setCurrentBalance] = useState<LeaveBalance | undefined>();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    leave_type: 'annual' as LeaveType,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const requireEmployee = ['platform_admin', 'tenant_admin', 'hr_manager'].includes(user?.role || '');

  useEffect(() => {
    const balance = balances.find(b => b.leave_type === formData.leave_type);
    setCurrentBalance(balance);
  }, [formData.leave_type, balances]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setError(undefined);
    setFormErrors({});
    setLoading(true);

    const validation = validateLeaveRequest(
      {
        ...formData,
        employee_id: selectedEmployeeId,
        tenant_id: user.tenant_id
      },
      balances,
      requireEmployee
    );

    if (!validation.valid) {
      setFormErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const { success, error: submitError } = await createLeaveRequest({
        employeeId: selectedEmployeeId || user.id,
        tenantId: user.tenant_id!,
        leaveType: formData.leave_type,
        startDate: formData.start_date,
        endDate: formData.end_date,
        reason: formData.reason
      });

      if (!success) {
        setError(submitError || 'Failed to submit leave request');
        return;
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError('An unexpected error occurred. Please try again.');
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
            type="button"
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
                {formErrors.employee && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.employee}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Leave Type
                {formData.leave_type === 'annual' && currentBalance && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Available: {currentBalance.balance_hours}h)
                  </span>
                )}
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
                <option value="other">Other</option>
              </select>
              {formErrors.leave_type && (
                <p className="mt-1 text-sm text-red-600">{formErrors.leave_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
                <span className="ml-1 text-sm text-gray-500">(Weekdays only)</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {formErrors.start_date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
                <span className="ml-1 text-sm text-gray-500">(Weekdays only)</span>
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                min={formData.start_date}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {formErrors.end_date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={3}
                minLength={5}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Please provide a detailed reason for your leave request"
              />
              {formErrors.reason && (
                <p className="mt-1 text-sm text-red-600">{formErrors.reason}</p>
              )}
            </div>

            {formData.leave_type === 'annual' && currentBalance && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Balance:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentBalance.balance_hours}h
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Period: {formatDisplayDate(currentBalance.year_start)} - {formatDisplayDate(currentBalance.year_end)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}