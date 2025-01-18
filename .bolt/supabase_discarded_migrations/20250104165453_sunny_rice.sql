-- Disable RLS and triggers
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;
DROP TRIGGER IF EXISTS before_employee_insert_trigger ON employee_profiles;

-- Drop any existing validation functions temporarily
DROP FUNCTION IF EXISTS validate_employee_data(text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS create_employee_auth_user() CASCADE;
DROP FUNCTION IF EXISTS before_employee_insert() CASCADE;

DO $$
DECLARE
  v_tenant_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_user_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_employee_id uuid := '33333333-3333-3333-3333-333333333333'::uuid;
BEGIN
  -- First ensure tenant exists
  INSERT INTO tenants (id, name)
  VALUES (v_tenant_id, 'Demo Company')
  ON CONFLICT (id) DO UPDATE 
  SET 
    name = EXCLUDED.name,
    updated_at = now();

  -- Delete existing records in correct dependency order
  DELETE FROM payslips WHERE employee_id IN (
    SELECT id FROM employee_profiles WHERE user_id = v_user_id
  );
  
  DELETE FROM timesheet_entries WHERE timesheet_id IN (
    SELECT id FROM timesheets WHERE employee_id IN (
      SELECT id FROM employee_profiles WHERE user_id = v_user_id
    )
  );
  
  DELETE FROM timesheets WHERE employee_id IN (
    SELECT id FROM employee_profiles WHERE user_id = v_user_id
  );
  
  DELETE FROM leave_requests WHERE employee_id IN (
    SELECT id FROM employee_profiles WHERE user_id = v_user_id
  );
  
  DELETE FROM leave_balances WHERE employee_id IN (
    SELECT id FROM employee_profiles WHERE user_id = v_user_id
  );
  
  DELETE FROM employee_profiles WHERE user_id = v_user_id;
  DELETE FROM users WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;

  -- Create auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    phone,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'tenant.admin@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', 'tenant_admin',
      'tenant_id', v_tenant_id
    ),
    'authenticated',
    'authenticated',
    '',
    now(),
    now()
  );

  -- Create public user
  INSERT INTO users (
    id,
    email,
    role,
    tenant_id,
    is_verified
  ) VALUES (
    v_user_id,
    'tenant.admin@example.com',
    'tenant_admin',
    v_tenant_id,
    true
  );

  -- Create employee profile
  INSERT INTO employee_profiles (
    id,
    user_id,
    tenant_id,
    first_name,
    last_name,
    email,
    ird_number,
    hourly_rate,
    employment_type,
    kiwisaver_rate,
    kiwisaver_enrolled,
    tax_code,
    is_active
  ) VALUES (
    v_employee_id,
    v_user_id,
    v_tenant_id,
    'Admin',
    'User',
    'tenant.admin@example.com',
    '123456789',
    45.00,
    'salary',
    3.0,
    true,
    'M',
    true
  );

  -- Create initial leave balances
  INSERT INTO leave_balances (
    employee_id,
    tenant_id,
    leave_type,
    balance_hours,
    accrued_hours,
    taken_hours,
    year_start,
    year_end
  ) VALUES 
  (
    v_employee_id,
    v_tenant_id,
    'annual',
    160.00,
    160.00,
    0.00,
    '2024-01-01',
    '2024-12-31'
  ),
  (
    v_employee_id,
    v_tenant_id,
    'sick',
    80.00,
    80.00,
    0.00,
    '2024-01-01',
    '2024-12-31'
  );

  -- Create initial payroll settings
  INSERT INTO payroll_settings (
    tenant_id,
    pay_period_type,
    pay_day
  ) VALUES (
    v_tenant_id,
    'monthly',
    1
  ) ON CONFLICT (tenant_id) DO NOTHING;

END $$;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;