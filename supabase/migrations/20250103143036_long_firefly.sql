/*
  # Add test users and tenant

  1. New Data
    - Test tenant "ACME Corporation"
    - Tenant admin user with credentials
    - Sample employee profile
  
  2. Security
    - Password is hashed using Supabase Auth
    - RLS policies are preserved
*/

-- Insert test tenant
INSERT INTO tenants (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'ACME Corporation');

-- Insert into users table first
INSERT INTO users (
  id,
  email,
  role,
  tenant_id,
  is_verified
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'tenant.admin@example.com',
  'tenant_admin',
  '11111111-1111-1111-1111-111111111111',
  true
);

-- Insert into auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'tenant.admin@example.com',
  crypt('demo-password', gen_salt('bf')),
  now(),
  '{"role": "tenant_admin", "tenant_id": "11111111-1111-1111-1111-111111111111"}'
);

-- Now we can safely insert the employee profile
INSERT INTO employee_profiles (
  id,
  user_id,
  tenant_id,
  first_name,
  last_name,
  hourly_rate,
  kiwisaver_rate,
  tax_code
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Admin',
  'User',
  45.00,
  3.0,
  'M'
);