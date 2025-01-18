-- Temporarily disable triggers and RLS
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_tenant_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_user_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_new_ird text;
BEGIN
  -- Find a unique IRD number
  WITH RECURSIVE ird_numbers AS (
    SELECT '123456001'::text as ird
    UNION ALL
    SELECT (ird::bigint + 1)::text
    FROM ird_numbers
    WHERE ird::bigint < 123456999
  )
  SELECT ird INTO v_new_ird
  FROM ird_numbers
  WHERE NOT EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = ird
    AND tenant_id = v_tenant_id
  )
  LIMIT 1;

  -- Update auth user
  UPDATE auth.users
  SET 
    email = 'tenant.admin1@example.com',
    raw_user_meta_data = jsonb_build_object(
      'role', 'tenant_admin',
      'tenant_id', v_tenant_id
    )
  WHERE id = v_user_id;

  -- Update public user
  UPDATE users 
  SET email = 'tenant.admin1@example.com'
  WHERE id = v_user_id;

  -- Update employee profile with guaranteed unique IRD
  UPDATE employee_profiles
  SET
    first_name = 'Admin',
    last_name = 'User',
    email = 'tenant.admin1@example.com',
    ird_number = v_new_ird
  WHERE user_id = v_user_id;

END $$;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;