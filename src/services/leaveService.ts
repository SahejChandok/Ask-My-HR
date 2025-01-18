import { supabase } from '../lib/supabase';
import { LeaveRequest } from '../types';
import { calculateLeaveHours } from '../utils/leaveCalculations';

interface CreateLeaveRequestParams {
  employeeId: string;
  tenantId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export async function createLeaveRequest({
  employeeId,
  tenantId,
  leaveType,
  startDate,
  endDate,
  reason
}: CreateLeaveRequestParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Get employee profile
    const { data: profiles, error: profileError } = await supabase
      .from('employee_profiles')
      .select('id')
      .match({ tenant_id: tenantId })
      .or(`user_id.eq.${employeeId},id.eq.${employeeId}`)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      throw new Error('Failed to fetch employee profile');
    }
    
    if (!profiles) {
      throw new Error('Employee profile not found');
    }

    // Calculate leave hours
    const leaveHours = calculateLeaveHours({
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType
    } as LeaveRequest);

    // Get current balance
    const { data: balances, error: balanceError } = await supabase
      .from('leave_balances')
      .select('balance_hours')
      .eq('employee_id', profiles.id)
      .eq('leave_type', leaveType)
      .eq('year_start', '2024-01-01')
      .maybeSingle();

    if (balanceError) {
      throw new Error('Failed to fetch leave balance');
    }

    // Validate balance for annual leave
    if (leaveType === 'annual' && balances && leaveHours > balances.balance_hours) {
      throw new Error(`Insufficient leave balance. Available: ${balances.balance_hours}h, Requested: ${leaveHours}h`);
    }

    // Create leave request
    const { error: requestError } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: profiles.id,
        tenant_id: tenantId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });

    if (requestError) {
      if (requestError.code === '23503') {
        throw new Error('Invalid employee or tenant reference');
      }
      throw requestError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating leave request:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit leave request';
    return {
      success: false,
      error: message
    };
  }
}