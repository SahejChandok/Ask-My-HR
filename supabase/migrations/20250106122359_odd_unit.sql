-- Update demo user credentials
UPDATE auth.users
SET 
  email = 'tenant.admin@example.com',
  encrypted_password = crypt('demo-password', gen_salt('bf')),
  email_confirmed_at = now(),
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', array['email']
  ),
  raw_user_meta_data = jsonb_build_object(
    'role', 'tenant_admin',
    'tenant_id', '11111111-1111-1111-1111-111111111111'
  )
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update public user record
UPDATE users 
SET 
  email = 'tenant.admin@example.com',
  role = 'tenant_admin',
  tenant_id = '11111111-1111-1111-1111-111111111111',
  is_verified = true
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update employee profile
UPDATE employee_profiles
SET
  first_name = 'Admin',
  last_name = 'User',
  email = 'tenant.admin@example.com',
  ird_number = '123456788',
  tenant_id = '11111111-1111-1111-1111-111111111111',
  user_id = '22222222-2222-2222-2222-222222222222'
WHERE id = '33333333-3333-3333-3333-333333333333';