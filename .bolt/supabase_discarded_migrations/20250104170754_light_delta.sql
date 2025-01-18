-- Disable RLS temporarily for seeding
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances DISABLE ROW LEVEL SECURITY;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;
DROP TRIGGER IF EXISTS before_employee_insert_trigger ON employee_profiles;
DROP FUNCTION IF EXISTS validate_employee_data(text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS create_employee_auth_user() CASCADE;
DROP FUNCTION IF EXISTS before_employee_insert() CASCADE;

DO $$
DECLARE
  -- Common IDs
  v_tenant_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  
  -- User IDs
  v_admin_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_employee1_id uuid := '33333333-3333-3333-3333-333333333333'::uuid;
  v_employee2_id uuid := '44444444-4444-4444-4444-444444444444'::uuid;
  v_employee3_id uuid := '55555555-5555-5555-555555555555'::uuid;
  
  -- Employee Profile IDs
  v_admin_profile_id uuid := '66666666-6666-6666-6666-666666666666'::uuid;
  v_employee1_profile_id uuid := '77777777-7777-7777-7777-777777777777'::uuid;
  v_employee2_profile_id uuid := '88888888-8888-8888-8888-888888888888'::uuid;
  v_employee3_profile_id uuid := '99999999-9999-9999-9999-999999999999'::uuid;

  -- Timesheet IDs
  v_timesheet1_id uuid;
  v_timesheet2_id uuid;
  v_timesheet3_id uuid;
BEGIN
  -- Clean up existing data in correct order
  DELETE FROM leave_balances WHERE tenant_id = v_tenant_id;
  DELETE FROM timesheet_entries WHERE timesheet_id IN (
    SELECT id FROM timesheets WHERE tenant_id = v_tenant_id
  );
  DELETE FROM timesheets WHERE tenant_id = v_tenant_id;
  DELETE FROM leave_requests WHERE tenant_id = v_tenant_id;
  DELETE FROM employee_profiles WHERE tenant_id = v_tenant_id;
  DELETE FROM users WHERE tenant_id = v_tenant_id;
  DELETE FROM auth.users WHERE raw_user_meta_data->>'tenant_id' = v_tenant_id::text;

  -- Create tenant
  INSERT INTO tenants (id, name)
  VALUES (v_tenant_id, 'Demo Company')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Create Tenant Admin
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'tenant.admin@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', 'tenant_admin', 'tenant_id', v_tenant_id),
    'authenticated',
    'authenticated'
  );

  INSERT INTO users (id, email, role, tenant_id, is_verified)
  VALUES (v_admin_id, 'tenant.admin@example.com', 'tenant_admin', v_tenant_id, true);

  INSERT INTO employee_profiles (
    id, user_id, tenant_id, first_name, last_name, email,
    ird_number, hourly_rate, employment_type,
    kiwisaver_rate, kiwisaver_enrolled, tax_code, is_active
  ) VALUES (
    v_admin_profile_id,
    v_admin_id,
    v_tenant_id,
    'Admin',
    'User',
    'tenant.admin@example.com',
    '123456789',
    48.08, -- $100,000 annual
    'salary',
    3.0,
    true,
    'M',
    true
  );

  -- Create Employee 1 (Hourly, high KiwiSaver)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    v_employee1_id,
    '00000000-0000-0000-0000-000000000000',
    'jane.smith@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', 'employee', 'tenant_id', v_tenant_id),
    'authenticated',
    'authenticated'
  );

  INSERT INTO users (id, email, role, tenant_id, is_verified)
  VALUES (v_employee1_id, 'jane.smith@example.com', 'employee', v_tenant_id, true);

  INSERT INTO employee_profiles (
    id, user_id, tenant_id, first_name, last_name, email,
    ird_number, hourly_rate, employment_type,
    kiwisaver_rate, kiwisaver_enrolled, tax_code, is_active
  ) VALUES (
    v_employee1_profile_id,
    v_employee1_id,
    v_tenant_id,
    'Jane',
    'Smith',
    'jane.smith@example.com',
    '123456001',
    35.00,
    'hourly',
    8.0,
    true,
    'M',
    true
  );

  -- Create Employee 2 (Salary, no KiwiSaver)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    v_employee2_id,
    '00000000-0000-0000-0000-000000000000',
    'bob.jones@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', 'employee', 'tenant_id', v_tenant_id),
    'authenticated',
    'authenticated'
  );

  INSERT INTO users (id, email, role, tenant_id, is_verified)
  VALUES (v_employee2_id, 'bob.jones@example.com', 'employee', v_tenant_id, true);

  INSERT INTO employee_profiles (
    id, user_id, tenant_id, first_name, last_name, email,
    ird_number, hourly_rate, employment_type,
    kiwisaver_rate, kiwisaver_enrolled, tax_code, is_active
  ) VALUES (
    v_employee2_profile_id,
    v_employee2_id,
    v_tenant_id,
    'Bob',
    'Jones',
    'bob.jones@example.com',
    '123456002',
    48.08, -- $100,000 annual
    'salary',
    0.0,
    false,
    'M',
    true
  );

  -- Create Employee 3 (Hourly, secondary tax code)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    v_employee3_id,
    '00000000-0000-0000-0000-000000000000',
    'sarah.wilson@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', 'employee', 'tenant_id', v_tenant_id),
    'authenticated',
    'authenticated'
  );

  INSERT INTO users (id, email, role, tenant_id, is_verified)
  VALUES (v_employee3_id, 'sarah.wilson@example.com', 'employee', v_tenant_id, true);

  INSERT INTO employee_profiles (
    id, user_id, tenant_id, first_name, last_name, email,
    ird_number, hourly_rate, employment_type,
    kiwisaver_rate, kiwisaver_enrolled, tax_code, is_active
  ) VALUES (
    v_employee3_profile_id,
    v_employee3_id,
    v_tenant_id,
    'Sarah',
    'Wilson',
    'sarah.wilson@example.com',
    '123456003',
    28.50,
    'hourly',
    3.0,
    true,
    'SB',
    true
  );

  -- Create leave balances for all employees
  INSERT INTO leave_balances (
    employee_id, tenant_id, leave_type,
    balance_hours, accrued_hours, taken_hours,
    year_start, year_end
  )
  SELECT 
    ep.id, ep.tenant_id, lt.leave_type,
    CASE 
      WHEN lt.leave_type = 'annual' THEN 160.00
      WHEN lt.leave_type = 'sick' THEN 80.00
      ELSE 0.00
    END as balance_hours,
    CASE 
      WHEN lt.leave_type = 'annual' THEN 160.00
      WHEN lt.leave_type = 'sick' THEN 80.00
      ELSE 0.00
    END as accrued_hours,
    0.00 as taken_hours,
    '2024-01-01'::date as year_start,
    '2024-12-31'::date as year_end
  FROM employee_profiles ep
  CROSS JOIN (
    SELECT unnest(ARRAY['annual', 'sick']::leave_type[]) as leave_type
  ) lt
  WHERE ep.tenant_id = v_tenant_id;

  -- Create timesheets for each employee
  -- Jane's timesheet
  INSERT INTO timesheets (
    id, employee_id, tenant_id, period_start, period_end,
    status, submitted_at, approved_at, approved_by
  ) VALUES (
    gen_random_uuid(),
    v_employee1_profile_id,
    v_tenant_id,
    '2024-03-04',
    '2024-03-08',
    'approved',
    now() - interval '2 days',
    now() - interval '1 day',
    v_admin_id
  ) RETURNING id INTO v_timesheet1_id;

  -- Bob's timesheet
  INSERT INTO timesheets (
    id, employee_id, tenant_id, period_start, period_end,
    status, submitted_at, approved_at, approved_by
  ) VALUES (
    gen_random_uuid(),
    v_employee2_profile_id,
    v_tenant_id,
    '2024-03-04',
    '2024-03-08',
    'approved',
    now() - interval '2 days',
    now() - interval '1 day',
    v_admin_id
  ) RETURNING id INTO v_timesheet2_id;

  -- Sarah's timesheet
  INSERT INTO timesheets (
    id, employee_id, tenant_id, period_start, period_end,
    status, submitted_at, approved_at, approved_by
  ) VALUES (
    gen_random_uuid(),
    v_employee3_profile_id,
    v_tenant_id,
    '2024-03-04',
    '2024-03-08',
    'approved',
    now() - interval '2 days',
    now() - interval '1 day',
    v_admin_id
  ) RETURNING id INTO v_timesheet3_id;

  -- Add timesheet entries for each employee
  -- Jane's entries
  INSERT INTO timesheet_entries (
    timesheet_id, date, start_time, end_time, break_minutes, description
  )
  SELECT 
    v_timesheet1_id,
    '2024-03-04'::date + (n || ' days')::interval,
    '09:00'::time,
    CASE WHEN n = 2 THEN '18:00'::time ELSE '17:00'::time END,
    30,
    CASE WHEN n = 2 THEN 'Overtime day' ELSE 'Regular day' END
  FROM generate_series(0, 4) n;

  -- Bob's entries
  INSERT INTO timesheet_entries (
    timesheet_id, date, start_time, end_time, break_minutes, description
  )
  SELECT 
    v_timesheet2_id,
    '2024-03-04'::date + (n || ' days')::interval,
    '09:00'::time,
    CASE WHEN n = 2 THEN '18:00'::time ELSE '17:00'::time END,
    30,
    CASE WHEN n = 2 THEN 'Overtime day' ELSE 'Regular day' END
  FROM generate_series(0, 4) n;

  -- Sarah's entries
  INSERT INTO timesheet_entries (
    timesheet_id, date, start_time, end_time, break_minutes, description
  )
  SELECT 
    v_timesheet3_id,
    '2024-03-04'::date + (n || ' days')::interval,
    '09:00'::time,
    CASE WHEN n = 2 THEN '18:00'::time ELSE '17:00'::time END,
    30,
    CASE WHEN n = 2 THEN 'Overtime day' ELSE 'Regular day' END
  FROM generate_series(0, 4) n;

  -- Create leave requests
  -- Jane's annual leave
  INSERT INTO leave_requests (
    employee_id, tenant_id, leave_type,
    start_date, end_date, status, reason,
    submitted_at, approved_at, approved_by
  ) VALUES (
    v_employee1_profile_id,
    v_tenant_id,
    'annual',
    '2024-03-18',
    '2024-03-22',
    'approved',
    'Annual vacation',
    now() - interval '5 days',
    now() - interval '3 days',
    v_admin_id
  );

  -- Bob's sick leave
  INSERT INTO leave_requests (
    employee_id, tenant_id, leave_type,
    start_date, end_date, status, reason,
    submitted_at, approved_at, approved_by
  ) VALUES (
    v_employee2_profile_id,
    v_tenant_id,
    'sick',
    '2024-03-11',
    '2024-03-11',
    'approved',
    'Doctor appointment',
    now() - interval '2 days',
    now() - interval '1 day',
    v_admin_id
  );

  -- Sarah's pending leave
  INSERT INTO leave_requests (
    employee_id, tenant_id, leave_type,
    start_date, end_date, status, reason,
    submitted_at
  ) VALUES (
    v_employee3_profile_id,
    v_tenant_id,
    'annual',
    '2024-03-25',
    '2024-03-29',
    'pending',
    'Family vacation',
    now() - interval '1 day'
  );

END $$;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;