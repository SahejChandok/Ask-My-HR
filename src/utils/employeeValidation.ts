import { supabase } from '../lib/supabase';
import { EmployeeProfile } from '../types';

export async function validateEmployee(data: Partial<EmployeeProfile>): Promise<{
  valid: boolean;
  message?: string;
}> {
  // Basic format validation
  if (!data.email?.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
    return {
      valid: false,
      message: 'Please enter a valid email address'
    };
  }

  // Validate required fields
  if (!data.email || !data.first_name || !data.last_name || !data.ird_number) {
    return {
      valid: false,
      message: 'Please fill in all required fields'
    };
  }

  // Validate IRD number format
  if (!/^\d{9}$/.test(data.ird_number)) {
    return {
      valid: false,
      message: 'IRD number must be exactly 9 digits'
    };
  }

  // Validate hourly rate
  if (data.hourly_rate <= 0) {
    return {
      valid: false,
      message: 'Hourly rate must be greater than 0'
    };
  }

  return { valid: true };
}

export async function validateEmployeeEmail(
  email: string,
  tenantId: string,
  employeeId?: string
): Promise<{
  valid: boolean;
  message?: string;
}> {
  try {
    // Call the Supabase function to validate email
    const { data, error } = await supabase
      .rpc('validate_employee_email', {
        p_email: email,
        p_tenant_id: tenantId,
        p_exclude_id: employeeId
      });

    if (error) throw error;

    return {
      valid: data.valid,
      message: data.message
    };
  } catch (error) {
    console.error('Error validating employee email:', error);
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Failed to validate email address'
    };
  }
}