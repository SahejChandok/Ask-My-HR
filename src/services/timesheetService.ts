import { supabase } from '../lib/supabase';
import { TimesheetEntryData } from '../types/timesheet';
import { TenantShiftConfig } from '../types/shift';
import { formatAPIDate } from '../utils/dateUtils';

export async function approveTimesheet(id: string, userId: string) {
  const { error } = await supabase
    .from('timesheets')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: userId
    })
    .eq('id', id);

  if (error) {
    console.error('Error approving timesheet:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function rejectTimesheet(id: string, userId: string, reason: string) {
  const { error } = await supabase
    .from('timesheets')
    .update({
      status: 'rejected',
      approved_at: null,
      approved_by: userId,
      rejection_reason: reason
    })
    .eq('id', id);

  if (error) {
    console.error('Error rejecting timesheet:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getTimesheets(tenantId: string) {
  const { data, error } = await supabase
    .from('timesheets')
    .select(`
      *,
      employee_profiles (
        first_name,
        last_name,
        email
      )
    `)
    .eq('tenant_id', tenantId)
    .order('period_start', { ascending: false });

  if (error) {
    console.error('Error fetching timesheets:', error);
    return [];
  }

  return data || [];
}

export async function submitTimesheet(
  employeeId: string,
  tenantId: string,
  entries: TimesheetEntryData[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create timesheet
    const { data: timesheet, error: timesheetError } = await supabase
      .from('timesheets')
      .insert({
        employee_id: employeeId,
        tenant_id: tenantId,
        period_start: entries[0].date,
        period_end: entries[entries.length - 1].date,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (timesheetError) throw timesheetError;

    // Create timesheet entries
    const { error: entriesError } = await supabase
      .from('timesheet_entries')
      .insert(
        entries.map(entry => ({
          timesheet_id: timesheet.id,
          ...entry,
          break_minutes: parseInt(entry.break_minutes)
        }))
      );

    if (entriesError) throw entriesError;

    return { success: true };
  } catch (error) {
    console.error('Error submitting timesheet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit timesheet'
    };
  }
}

export async function getEmployeeShiftRules(employeeId: string): Promise<TenantShiftConfig | undefined> {
  try {
    // Get employee's shift rule group
    const { data: employee } = await supabase
      .from('employee_profiles') 
      .select('id, shift_rule_group_id, hourly_rate')
      .or(`id.eq.${employeeId},user_id.eq.${employeeId}`) 
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!employee?.shift_rule_group_id) return undefined;

    // Get shift rules
    const { data: rules } = await supabase
      .from('tenant_shift_config')
      .select('*')
      .eq('id', employee.shift_rule_group_id)
      .single();

    if (!rules) return undefined;

    // Transform snake_case to camelCase
    return {
      ...rules,
      timeRules: rules.time_rules,
      rateMultipliers: rules.rate_multipliers,
      rosterRules: rules.roster_rules
    };
  } catch (error) {
    console.error('Error loading shift rules:', error);
    return undefined;
  }
}