import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TimesheetFormHeader } from './TimesheetFormHeader';
import { TimesheetEntryList } from './TimesheetEntryList';
import { TimesheetEntryData } from '../../types/timesheet';
import { validateTimesheet } from '../../utils/timesheetValidation';
import { submitTimesheet, getEmployeeShiftRules } from '../../services/timesheetService';
import { formatAPIDate } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';
import { TenantShiftConfig } from '../../types/shift';

interface TimesheetFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export function TimesheetForm({ onClose, onSubmit }: TimesheetFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [shiftRules, setShiftRules] = useState<TenantShiftConfig>();
  const [hourlyRate, setHourlyRate] = useState<number>();
  const [error, setError] = useState<string>();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<TimesheetEntryData[]>([{
    date: formatAPIDate(new Date()),
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: '30',
    description: '',
  }]);

  const handleEntryChange = (index: number, field: keyof TimesheetEntryData, value: string) => {
    setEntries(entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  useEffect(() => {
    if (selectedEmployeeId || user?.id) {
      loadEmployeeDetails(selectedEmployeeId || user?.id);
    }
  }, [selectedEmployeeId, user?.id]);

  async function loadEmployeeDetails(employeeId: string) {
    try {
      const { data: employee } = await supabase
        .from('employee_profiles')
        .select('*')
        .or(`id.eq.${employeeId},user_id.eq.${employeeId}`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (employee) {
        setHourlyRate(employee.hourly_rate);
        const rules = await getEmployeeShiftRules(employee.id);
        setShiftRules(rules);
      }
    } catch (error) {
      console.error('Error loading employee details:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;
    
    setError(undefined);
    setValidationErrors({});
    setLoading(true);

    try {
      // Validate timesheet
      const validation = validateTimesheet(entries);
      if (!validation.valid) {
        setValidationErrors(validation.errors || {});
        return;
      }

      // Submit timesheet
      const { success, error } = await submitTimesheet(
        selectedEmployeeId || user.id,
        user.tenant_id,
        entries
      );

      if (!success) {
        throw new Error(error);
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit timesheet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <TimesheetFormHeader
          showEmployeeSelect={['platform_admin', 'tenant_admin', 'payroll_admin'].includes(user?.role || '')}
          selectedEmployeeId={selectedEmployeeId}
          onEmployeeChange={setSelectedEmployeeId}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <TimesheetEntryList
              entries={entries}
              errors={validationErrors}
              shiftRules={shiftRules || undefined}
              hourlyRate={hourlyRate || 0}
              onEntryChange={handleEntryChange}
              onAddEntry={() => setEntries([
                ...entries,
                {
                  date: formatAPIDate(new Date()),
                  start_time: '09:00',
                  end_time: '17:00',
                  break_minutes: '30',
                  description: '',
                }
              ])}
            />
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Timesheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}