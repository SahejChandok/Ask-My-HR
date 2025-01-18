import { supabase } from '../lib/supabase';

export async function rollbackPayrollRun(
  runId: string,
  userId: string,
  reason: string
) {
  if (!reason.trim()) {
    throw new Error('A reason must be provided for rolling back a payroll run');
  }

  const { error } = await supabase.rpc('rollback_payroll_run', {
    p_run_id: runId,
    p_user_id: userId,
    p_reason: reason
  });

  if (error) {
    if (error.message.includes('Unauthorized')) {
      throw new Error('You do not have permission to rollback payroll runs');
    }
    if (error.message.includes('Only completed')) {
      throw new Error('Only completed payroll runs can be rolled back');
    }
    throw new Error(error.message);
  }
}