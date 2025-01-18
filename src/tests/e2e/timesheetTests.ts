import { supabase } from '../../lib/supabase';
import { formatAPIDate } from '../../utils/dateUtils';
import { TestResult } from '../types';

export async function runTimesheetTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let employeeId: string;

  try {
    // Get test employee
    const { data: employee, error: employeeError } = await supabase
      .from('employee_profiles')
      .select('id')
      .eq('email', 'test.employee@example.com')
      .single();

    if (employeeError) throw employeeError;
    employeeId = employee.id;

    results.push({
      step: 'Get test employee',
      passed: true,
      data: { employeeId }
    });

    // Create timesheet
    const periodStart = formatAPIDate(new Date());
    const periodEnd = formatAPIDate(new Date());

    const { data: timesheet, error: timesheetError } = await supabase
      .from('timesheets')
      .insert({
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'submitted'
      })
      .select()
      .single();

    if (timesheetError) throw timesheetError;

    results.push({
      step: 'Create timesheet',
      passed: true,
      data: { timesheetId: timesheet.id }
    });

    // Add timesheet entries
    const { error: entriesError } = await supabase
      .from('timesheet_entries')
      .insert([{
        timesheet_id: timesheet.id,
        date: periodStart,
        start_time: '09:00',
        end_time: '17:00',
        break_minutes: 30,
        description: 'Regular day'
      }]);

    if (entriesError) throw entriesError;

    results.push({
      step: 'Add timesheet entries',
      passed: true
    });

    // Verify timesheet data
    const { data: verifyData, error: verifyError } = await supabase
      .from('timesheets')
      .select('*, timesheet_entries(*)')
      .eq('id', timesheet.id)
      .single();

    if (verifyError) throw verifyError;

    results.push({
      step: 'Verify timesheet data',
      passed: true,
      data: {
        hasEntries: verifyData.timesheet_entries.length > 0,
        status: verifyData.status
      }
    });

    return results;

  } catch (error) {
    results.push({
      step: 'Error in timesheet tests',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return results;
  }
}