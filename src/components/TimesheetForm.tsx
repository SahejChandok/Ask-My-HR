import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TimesheetFormHeader } from './timesheets/TimesheetFormHeader';
import { TimesheetEntryList } from './timesheets/TimesheetEntryList';
import { TimesheetEntryData } from '../types/timesheet';
import { validateTimesheet } from '../utils/timesheetValidation';
import { formatAPIDate } from '../utils/dateUtils';
import { PUBLIC_HOLIDAYS, HOLIDAY_PAY_RATES, isPublicHoliday } from '../utils/holidayRules';

interface TimesheetFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export function TimesheetForm({ onClose, onSubmit }: TimesheetFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [error, setError] = useState<string>();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<TimesheetEntryData[]>([{
    date: formatAPIDate(new Date()),
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: '30',
    description: '',
  }]);

  const handleEntryChange = (index: number, field: keyof typeof entries[0], value: string) => {
    setEntries(entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    ));
  };
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;
    
    
    setError(undefined);
    setValidationErrors({});
    setLoading(true);

    // Validate timesheet
    const validation = validateTimesheet(entries);
    if (!validation.valid) {
      setValidationErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      // Get employee profile
      const { data: profiles, error: profileError } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('id', selectedEmployeeId || user.id)
        .eq('tenant_id', user.tenant_id)
        .single();

      if (profileError) throw profileError;
      if (!profiles) {
        throw new Error('Employee profile not found. Please try again or contact support.');
      }

      // Create timesheet
      const { data: timesheet, error: timesheetError } = await supabase
        .from('timesheets')
        .insert({
          employee_id: profiles.id, // Use the profile ID directly
          tenant_id: user.tenant_id,
          period_start: entries[0].date,
          period_end: entries[entries.length - 1].date,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (timesheetError) throw timesheetError;

      // Create timesheet entries
      const { error: entriesError } = await supabase
        .from('timesheet_entries')
        .insert(
          entries.map((entry) => ({
            timesheet_id: timesheet.id,
            ...entry,
            break_minutes: parseInt(entry.break_minutes),
            is_holiday: isPublicHoliday(entry.date),
            rate_multiplier: isPublicHoliday(entry.date) ? HOLIDAY_PAY_RATES.PUBLIC_HOLIDAY_RATE : 1.0
          }))
        );

      if (entriesError) throw entriesError;

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      if (error instanceof Error) {
        if (error.message.includes('406')) {
          setError('Unable to find employee profile. Please check your selection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to submit timesheet. Please try again.');
      }
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