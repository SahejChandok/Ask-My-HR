/*
  # Fix NULL Handling in Auth Schema

  1. Changes
    - Add proper column defaults
    - Fix NULL handling for auth columns
    - Update demo user with non-null values
  
  2. Security
    - Maintain existing RLS policies
*/

-- Update auth.users to handle NULLs properly
ALTER TABLE auth.users 
  ALTER COLUMN confirmation_token SET DEFAULT '',
  ALTER COLUMN confirmation_sent_at SET DEFAULT NULL,
  ALTER COLUMN recovery_token SET DEFAULT '',
  ALTER COLUMN recovery_sent_at SET DEFAULT NULL,
  ALTER COLUMN email_change_token_new SET DEFAULT '',
  ALTER COLUMN email_change SET DEFAULT '',
  ALTER COLUMN email_change_sent_at SET DEFAULT NULL,
  ALTER COLUMN phone SET DEFAULT '',
  ALTER COLUMN phone_change SET DEFAULT '',
  ALTER COLUMN phone_change_token SET DEFAULT '',
  ALTER COLUMN phone_change_sent_at SET DEFAULT NULL,
  ALTER COLUMN email_change_token_current SET DEFAULT '',
  ALTER COLUMN email_change_confirm_status SET DEFAULT 0,
  ALTER COLUMN banned_until SET DEFAULT NULL,
  ALTER COLUMN reauthentication_token SET DEFAULT '',
  ALTER COLUMN reauthentication_sent_at SET DEFAULT NULL;

-- Update existing NULL values to empty strings where appropriate
UPDATE auth.users 
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone = COALESCE(phone, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- Recreate demo user with proper NULL handling
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
    reauthentication_token
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
    ''  -- reauthentication_token
);