/*
  # Fix Remaining NULL Values in Auth Schema

  1. Changes
    - Set default values for all remaining nullable columns
    - Update any existing NULL values to appropriate defaults
    - Ensure all string columns use empty string instead of NULL
  
  2. Security
    - Maintains existing RLS policies
*/

-- Update remaining columns in auth.users to handle NULLs properly
ALTER TABLE auth.users 
  ALTER COLUMN encrypted_password SET DEFAULT '',
  ALTER COLUMN raw_app_meta_data SET DEFAULT '{}',
  ALTER COLUMN raw_user_meta_data SET DEFAULT '{}',
  ALTER COLUMN email_change_confirm_status SET DEFAULT 0,
  ALTER COLUMN is_super_admin SET DEFAULT false,
  ALTER COLUMN phone_confirmed_at SET DEFAULT NULL,
  ALTER COLUMN is_sso_user SET DEFAULT false,
  ALTER COLUMN deleted_at SET DEFAULT NULL,
  ALTER COLUMN is_anonymous SET DEFAULT false;

-- Update any remaining NULL values to appropriate defaults
UPDATE auth.users 
SET
  encrypted_password = COALESCE(encrypted_password, ''),
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  is_super_admin = COALESCE(is_super_admin, false),
  is_sso_user = COALESCE(is_sso_user, false),
  is_anonymous = COALESCE(is_anonymous, false);

-- Recreate demo user to ensure all fields are properly set
DELETE FROM auth.users WHERE email = 'tenant.admin@example.com';

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
    role,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone,
    phone_change,
    phone_change_token,
    email_change_token_current,
    reauthentication_token,
    is_super_admin,
    is_sso_user,
    is_anonymous,
    email_change_confirm_status
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
    'authenticated',
    '', -- confirmation_token
    '', -- recovery_token
    '', -- email_change_token_new
    '', -- email_change
    '', -- phone
    '', -- phone_change
    '', -- phone_change_token
    '', -- email_change_token_current
    '', -- reauthentication_token
    false, -- is_super_admin
    false, -- is_sso_user
    false, -- is_anonymous
    0     -- email_change_confirm_status
);