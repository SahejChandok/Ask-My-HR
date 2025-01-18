import { supabase } from '../../lib/supabase';
import { checkSupabaseConnection } from '../../lib/supabaseConnection';

export async function rollbackPayrollRun(
  runId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      return {
        success: false,
        error: 'Unable to connect to the server. Please try again.'
      };
    }

    if (!reason.trim()) {
      return {
        success: false,
        error: 'Please provide a reason for rolling back the payroll run'
      };
    }

    // Get payroll run details first
    const { data: run, error: runError } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError) {
      return {
        success: false,
        error: 'Failed to retrieve payroll run details'
      };
    }

    if (!run) {
      return {
        success: false,
        error: 'Payroll run not found'
      };
    }

    if (run.status !== 'completed') {
      return {
        success: false,
        error: 'Only completed payroll runs can be rolled back'
      };
    }

    // Check user authorization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'Failed to verify user authorization'
      };
    }

    if (!['platform_admin', 'tenant_admin'].includes(userData.role)) {
      return {
        success: false,
        error: 'Only tenant administrators can rollback payroll runs'
      };
    }

    // Call the rollback function
    const { error: rollbackError } = await supabase
      .rpc('rollback_payroll_run', {
        p_run_id: runId,
        p_user_id: userId,
        p_reason: reason.trim()
      });

    if (rollbackError) {
      return {
        success: false,
        error: rollbackError.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error rolling back payroll:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while rolling back the payroll run'
    };
  }
}