import { supabase } from '../lib/supabase';
import { testSupabaseConnection } from '../utils/supabaseTest';

async function runE2ETest() {
  // 1. Test connection
  const connectionTest = await testSupabaseConnection();
  console.log('Connection test:', connectionTest);

  if (!connectionTest.connected) {
    throw new Error(`Failed to connect to Supabase: ${connectionTest.error}`);
  }

  // 2. Test authentication
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@acme.com',
    password: 'test-password'
  });

  if (authError) {
    throw new Error(`Auth failed: ${authError.message}`);
  }

  // 3. Test timesheet submission
  const { data: timesheet, error: timesheetError } = await supabase
    .from('timesheets')
    .insert({
      employee_id: '44444444-4444-4444-4444-444444444444',
      period_start: '2024-03-01',
      period_end: '2024-03-07',
      status: 'submitted'
    })
    .select()
    .single();

  if (timesheetError) {
    throw new Error(`Timesheet creation failed: ${timesheetError.message}`);
  }

  // 4. Test leave request approval
  const { error: leaveError } = await supabase
    .from('leave_requests')
    .update({ status: 'approved' })
    .eq('id', timesheet.id);

  if (leaveError) {
    throw new Error(`Leave approval failed: ${leaveError.message}`);
  }

  console.log('All tests passed!');
}

// Only run in development
if (import.meta.env.DEV) {
  runE2ETest().catch(console.error);
}