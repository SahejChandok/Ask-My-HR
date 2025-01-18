-- Temporarily disable triggers and RLS
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;

-- First check if the IRD number is already in use and update it if needed
DO $$
DECLARE
  v_existing_ird text;
  v_new_ird text := '123456789'; -- Different IRD number
BEGIN
  -- Check if IRD number exists
  SELECT ird_number INTO v_existing_ird
  FROM employee_profiles
  WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND ird_number = '123456788';

  -- If IRD exists, use a different one
  IF v_existing_ird IS NOT NULL THEN
    v_new_ird := '123456789';
  ELSE
    v_new_ird := '123456788';
  END IF;

  -- Update auth user
  UPDATE auth.users
  SET 
    email = 'tenant.admin1@example.com',
    raw_user_meta_data = jsonb_build_object(
      'role', 'tenant_admin',
      'tenant_id', '11111111-1111-1111-1111-111111111111'
    )
  WHERE id = '22222222-2222-2222-2222-222222222222';

  -- Update public user
  UPDATE users 
  SET email = 'tenant.admin1@example.com'
  WHERE id = '22222222-2222-2222-2222-222222222222';

  -- Update employee profile with unique IRD
  UPDATE employee_profiles
  SET
    first_name = 'Admin',
    last_name = 'User',
    email = 'tenant.admin1@example.com',
    ird_number = v_new_ird
  WHERE user_id = '22222222-2222-2222-2222-222222222222';

END $$;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;