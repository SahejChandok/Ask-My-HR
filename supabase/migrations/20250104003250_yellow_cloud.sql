-- Temporarily disable triggers and RLS
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles DISABLE ROW LEVEL SECURITY;

-- Create or update tenant with proper UUID format
INSERT INTO tenants (id, name)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'ACME Corporation')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Update auth user with proper UUID format
UPDATE auth.users
SET 
  email = 'tenant.admin1@example.com',
  raw_user_meta_data = jsonb_build_object(
    'role', 'tenant_admin',
    'tenant_id', '11111111-1111-1111-1111-111111111111'::uuid
  )
WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Update public user with proper UUID format
UPDATE users 
SET 
  email = 'tenant.admin1@example.com',
  tenant_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

-- Update employee profile with proper UUID format
UPDATE employee_profiles
SET
  first_name = 'Admin',
  last_name = 'User',
  email = 'tenant.admin1@example.com',
  ird_number = '123456788',
  tenant_id = '11111111-1111-1111-1111-111111111111'::uuid,
  user_id = '22222222-2222-2222-2222-222222222222'::uuid
WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;