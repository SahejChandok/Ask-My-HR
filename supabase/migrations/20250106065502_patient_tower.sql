-- First ensure tenant exists
INSERT INTO tenants (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'ACME Corporation')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Update existing auth user if exists, otherwise do nothing
UPDATE auth.users
SET 
  email = 'tenant.admin@example.com',
  raw_user_meta_data = jsonb_build_object(
    'role', 'tenant_admin',
    'tenant_id', '11111111-1111-1111-1111-111111111111'
  ),
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', array['email']
  )
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update public user if exists
UPDATE users 
SET 
  email = 'tenant.admin@example.com',
  role = 'tenant_admin',
  tenant_id = '11111111-1111-1111-1111-111111111111',
  is_verified = true
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update employee profile if exists
UPDATE employee_profiles
SET
  first_name = 'Admin',
  last_name = 'User',
  email = 'tenant.admin@example.com',
  ird_number = '123456788',
  tenant_id = '11111111-1111-1111-1111-111111111111',
  user_id = '22222222-2222-2222-2222-222222222222'
WHERE id = '33333333-3333-3333-3333-333333333333';