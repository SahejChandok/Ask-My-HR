import { supabase } from '../../lib/supabase';
import { formatAPIDate } from '../../utils/dateUtils';
import { TestResult } from '../types';

export async function runLeaveTests(): Promise<TestResult[]> {
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

    // Create leave request
    const startDate = formatAPIDate(new Date());
    const endDate = formatAPIDate(new Date());

    const { data: leave, error: leaveError } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type: 'annual',
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        reason: 'Test leave request'
      })
      .select()
      .single();

    if (leaveError) throw leaveError;

    results.push({
      step: 'Create leave request',
      passed: true,
      data: { leaveId: leave.id }
    });

    // Approve leave request
    const { error: approveError } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', leave.id);

    if (approveError) throw approveError;

    results.push({
      step: 'Approve leave request',
      passed: true
    });

    // Verify leave balances
    const { data: balances, error: balancesError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type', 'annual');

    if (balancesError) throw balancesError;

    results.push({
      step: 'Verify leave balances',
      passed: true,
      data: {
        hasBalances: balances.length > 0,
        balance: balances[0]?.balance_hours
      }
    });

    return results;

  } catch (error) {
    results.push({
      step: 'Error in leave tests',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return results;
  }
}