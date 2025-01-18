import { supabase } from '../../lib/supabase';
import { TestResult } from '../types';

export async function runEmployeeTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let tenantId: string;
  let adminId: string;

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

    results.push({
      step: 'Create test employee',
      passed: true,
      data: { employeeId: employee.id }
    });

    // Step 3: Verify employee data
    const { data: verifyData, error: verifyError } = await supabase
      .from('employee_profiles')
      .select('*, users!inner(*)')
      .eq('id', employee.id)
      .single();

    if (verifyError) throw verifyError;

    results.push({
      step: 'Verify employee data',
      passed: true,
      data: {
        hasAuthUser: !!verifyData.users,
        isActive: verifyData.is_active
      }
    });

    return results;

  } catch (error) {
    results.push({
      step: 'Error in employee tests',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return results;
  }
}