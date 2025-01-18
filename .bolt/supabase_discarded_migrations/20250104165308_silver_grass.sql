-- Temporarily disable triggers and RLS
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;

-- First, delete any existing records with conflicting IRD numbers
DELETE FROM employee_profiles 
WHERE ird_number = '123456788' 
AND tenant_id = '11111111-1111-1111-1111-111111111111'
AND user_id != '22222222-2222-2222-2222-222222222222';

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

-- Update employee profile with a unique IRD number
UPDATE employee_profiles
SET
  first_name = 'Admin',
  last_name = 'User',
  email = 'tenant.admin1@example.com',
  ird_number = '123456789' -- Changed to a different number to avoid conflict
WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;