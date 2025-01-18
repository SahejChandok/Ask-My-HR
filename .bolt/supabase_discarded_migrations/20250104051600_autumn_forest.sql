-- Disable RLS temporarily for seeding
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_tenant_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_admin2_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid;
  v_admin2_profile_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid;
BEGIN
  -- Create second admin user if not exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_admin2_id OR email = 'tenant.admin2@example.com'
  ) THEN
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
      v_admin2_id,
      '00000000-0000-0000-0000-000000000000',
      'tenant.admin2@example.com',
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
  END IF;

  -- Create public user record if not exists
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = v_admin2_id OR email = 'tenant.admin2@example.com'
  ) THEN
    INSERT INTO users (
      id,
      email,
      role,
      tenant_id,
      is_verified
    ) VALUES (
      v_admin2_id,
      'tenant.admin2@example.com',
      'tenant_admin',
      v_tenant_id,
      true
    );
  END IF;

  -- Create employee profile if not exists
  IF NOT EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE id = v_admin2_profile_id 
    OR (email = 'tenant.admin2@example.com' AND tenant_id = v_tenant_id)
  ) THEN
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
      v_admin2_profile_id,
      v_admin2_id,
      v_tenant_id,
      'Admin',
      'User 2',
      'tenant.admin2@example.com',
      '987654321',  -- Different IRD number for second admin
      48.08,
      'salary',
      3.0,
      true,
      'M',
      true
    );
  END IF;

  -- Create initial leave balances if not exists
  INSERT INTO leave_balances (
    employee_id,
    tenant_id,
    leave_type,
    balance_hours,
    accrued_hours,
    taken_hours,
    year_start,
    year_end
  )
  SELECT 
    v_admin2_profile_id,
    v_tenant_id,
    lt.leave_type,
    CASE 
      WHEN lt.leave_type = 'annual' THEN 160.00
      WHEN lt.leave_type = 'sick' THEN 80.00
      ELSE 0.00
    END,
    CASE 
      WHEN lt.leave_type = 'annual' THEN 160.00
      WHEN lt.leave_type = 'sick' THEN 80.00
      ELSE 0.00
    END,
    0.00,
    '2024-01-01',
    '2024-12-31'
  FROM (
    SELECT unnest(ARRAY['annual', 'sick']::leave_type[]) as leave_type
  ) lt
  WHERE NOT EXISTS (
    SELECT 1 FROM leave_balances
    WHERE employee_id = v_admin2_profile_id
    AND leave_type = lt.leave_type
    AND year_start = '2024-01-01'
  );

END $$;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;