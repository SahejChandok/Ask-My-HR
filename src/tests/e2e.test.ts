import { supabase } from '../lib/supabase';
import { testSupabaseConnection } from '../utils/supabaseTest';

const TEST_EMPLOYEE = {
  first_name: 'Test',
  last_name: 'Employee',
  email: 'test.employee@example.com',
  ird_number: '012345678',
  hourly_rate: 30.00,
  employment_type: 'hourly',
  kiwisaver_enrolled: true,
  kiwisaver_rate: 3,
  tax_code: 'M',
  is_active: true
};

async function runTestScenario() {
  console.log('Starting test scenario...');

  // 1. Test connection
  const connection = await testSupabaseConnection();
  if (!connection.connected) {
    throw new Error(`Supabase connection failed: ${connection.error}`);
  }
  console.log('✅ Supabase connected');

  // 2. Sign in as tenant admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'tenant.admin@example.com',
    password: 'demo-password'
  });
  if (authError) throw authError;
  console.log('✅ Authentication successful');

  // 3. Create new employee
  const { data: employee, error: employeeError } = await supabase
    .from('employee_profiles')
    .insert([{
      ...TEST_EMPLOYEE,
      tenant_id: authData.user.user_metadata.tenant_id
    }])
    .select()
    .single();
    
  if (employeeError) throw employeeError;
  console.log('✅ Employee created');

  // 4. Submit timesheet
  const { data: timesheet, error: timesheetError } = await supabase
    .from('timesheets')
    .insert({
      employee_id: employee.id,
      tenant_id: authData.user.user_metadata.tenant_id,
      period_start: '2024-03-01',
      period_end: '2024-03-01',
      status: 'submitted'
    })
    .select()
    .single();

  if (timesheetError) throw timesheetError;

  // Add timesheet entry
  const { error: entryError } = await supabase
    .from('timesheet_entries')
    .insert({
      timesheet_id: timesheet.id,
      date: '2024-03-01',
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 30
    });

  if (entryError) throw entryError;
  console.log('✅ Timesheet submitted');

  // 5. Approve timesheet
  const { error: approveError } = await supabase
    .from('timesheets')
    .update({ 
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: authData.user.id
    })
    .eq('id', timesheet.id);

  if (approveError) throw approveError;
  console.log('✅ Timesheet approved');

  // 6. Submit leave request
  const { data: leave, error: leaveError } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      tenant_id: authData.user.user_metadata.tenant_id,
      leave_type: 'annual',
      start_date: '2024-03-11',
      end_date: '2024-03-11',
      status: 'pending'
    })
    .select()
    .single();

  if (leaveError) throw leaveError;
  console.log('✅ Leave request submitted');

  // 7. Process payroll
  const { error: payrollError } = await supabase
    .from('payroll_runs')
    .insert({
      tenant_id: authData.user.user_metadata.tenant_id,
      period_start: '2024-03-01',
      period_end: '2024-03-01',
      processed_by: authData.user.id,
      status: 'completed'
    });

  if (payrollError) throw payrollError;
  console.log('✅ Payroll processed');

  console.log('All tests passed! 🎉');
}

// Only run in development
if (import.meta.env.DEV) {
  runTestScenario().catch(console.error);
}