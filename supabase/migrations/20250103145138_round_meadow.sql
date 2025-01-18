/*
  # Fix auth user setup

  1. Changes
    - Reset and recreate demo user with proper fields
    - Set correct metadata and permissions
    - Remove generated column assignments
  
  2. Security
    - Maintain existing RLS policies
    - Set proper user metadata
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
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    aud,
    role
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'tenant.admin@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
    ),
    jsonb_build_object(
        'role', 'tenant_admin',
        'tenant_id', '11111111-1111-1111-1111-111111111111'
    ),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
);

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Update public user to match
UPDATE users SET
    is_verified = true
WHERE id = '22222222-2222-2222-2222-222222222222';