/*
  # Fix auth user setup and permissions

  1. Changes
    - Reset and ensure proper auth user setup
    - Grant necessary permissions
    - Fix metadata format
  
  2. Security
    - Ensure proper password hashing
    - Set correct user metadata
*/

-- Drop and recreate the demo user to ensure clean state
DELETE FROM auth.users WHERE email = 'tenant.admin@example.com';

-- Insert demo user with proper setup
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'tenant.admin@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    '{"role":"tenant_admin","tenant_id":"11111111-1111-1111-1111-111111111111"}'::jsonb,
    now(),
    now(),
    now()
);

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Ensure RLS is properly configured
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;