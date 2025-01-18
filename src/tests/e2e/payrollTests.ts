import { supabase } from '../../lib/supabase';
import { formatAPIDate } from '../../utils/dateUtils';
import { PayrollRun, TimesheetEntry } from '../../types';

interface TestResult {
  step: string;
  passed: boolean;
  error?: string;
  data?: any;
}

export async function runPayrollTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let tenantId: string;
  let adminId: string;
  let employeeId: string;
  let timesheetId: string;
  let payrollRunId: string;

  try {
    // Step 1: Login as Tenant Admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'tenant.admin@example.com',
      password: 'demo-password'
    });

    if (authError) throw authError;
    
    adminId = authData.user.id;
    tenantId = authData.user.user_metadata.tenant_id;

    results.push({
      step: 'Login as Tenant Admin',
      passed: true,
      data: { adminId, tenantId }
    });

    // Step 2: Create test employee
    const { data: employee, error: employeeError } = await supabase
      .from('employee_profiles')
      .insert({
        first_name: 'Test',
        last_name: 'Employee',
        email: 'test.employee@example.com',
        ird_number: '123456789',
        hourly_rate: 30.00,
        employment_type: 'hourly',
        kiwisaver_enrolled: true,
        kiwisaver_rate: 3,
        tax_code: 'M',
        is_active: true,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (employeeError) throw employeeError;
    employeeId = employee.id;

    results.push({
      step: 'Create test employee',
      passed: true,
      data: { employeeId }
    });

    // Step 3: Submit timesheet
    const periodStart = formatAPIDate(new Date());
    const periodEnd = formatAPIDate(new Date());

    const { data: timesheet, error: timesheetError } = await supabase
      .from('timesheets')
      .insert({
        employee_id: employeeId,
        tenant_id: tenantId,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'submitted'
      })
      .select()
      .single();

    if (timesheetError) throw timesheetError;
    timesheetId = timesheet.id;

    results.push({
      step: 'Submit timesheet',
      passed: true,
      data: { timesheetId }
    });

    // Step 4: Add timesheet entries
    const entries: Partial<TimesheetEntry>[] = [
      {
        timesheet_id: timesheetId,
        date: periodStart,
        start_time: '09:00',
        end_time: '17:00',
        break_minutes: 30,
        description: 'Regular day'
      }
    ];

    const { error: entriesError } = await supabase
      .from('timesheet_entries')
      .insert(entries);

    if (entriesError) throw entriesError;

    results.push({
      step: 'Add timesheet entries',
      passed: true
    });

    // Step 5: Approve timesheet
    const { error: approveError } = await supabase
      .from('timesheets')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId
      })
      .eq('id', timesheetId);

    if (approveError) throw approveError;

    results.push({
      step: 'Approve timesheet',
      passed: true
    });

    // Step 6: Process payroll
    const { data: payrollData, error: payrollError } = await supabase
      .rpc('process_payroll', {
        p_tenant_id: tenantId,
        p_user_id: adminId,
        p_period_start: periodStart,
        p_period_end: periodEnd
      });

    if (payrollError) throw payrollError;
    
    // Get payroll run ID
    const { data: runs } = await supabase
      .from('payroll_runs')
      .select()
      .eq('tenant_id', tenantId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .limit(1);

    payrollRunId = runs?.[0]?.id;

    results.push({
      step: 'Process payroll',
      passed: true,
      data: { payrollRunId }
    });

    // Step 7: Verify payslips
    const { data: payslips, error: payslipsError } = await supabase
      .from('payslips')
      .select('*')
      .eq('payroll_run_id', payrollRunId);

    if (payslipsError) throw payslipsError;

    if (!payslips?.length) {
      throw new Error('No payslips generated');
    }

    results.push({
      step: 'Verify payslips',
      passed: true,
      data: { payslipCount: payslips.length }
    });

    // Step 8: Verify calculation logs
    const { data: logs, error: logsError } = await supabase
      .from('payroll_calculation_logs')
      .select('*')
      .eq('payroll_run_id', payrollRunId);

    if (logsError) throw logsError;

    const requiredLogTypes = [
      'timesheet_summary',
      'hourly_calculation',
      'kiwisaver_calculation',
      'tax_calculation',
      'final_calculation'
    ];

    const missingLogs = requiredLogTypes.filter(type =>
      !logs?.some(log => log.log_type === type)
    );

    if (missingLogs.length > 0) {
      throw new Error(`Missing calculation logs: ${missingLogs.join(', ')}`);
    }

    results.push({
      step: 'Verify calculation logs',
      passed: true,
      data: { logCount: logs.length }
    });

    return results;

  } catch (error) {
    // Add failed step to results
    results.push({
      step: 'Error in test execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return results;
  }
}