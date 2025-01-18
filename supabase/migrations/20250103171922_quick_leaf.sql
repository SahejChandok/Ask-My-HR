/*
  # Fix Phone Field Constraint

  1. Changes
    - Remove existing phone constraint
    - Add new conditional unique constraint for phone field
    - Update auth user creation function
*/

-- First, drop the existing phone constraint if it exists
ALTER TABLE auth.users 
DROP CONSTRAINT IF EXISTS users_phone_key;

-- Create a new unique index that excludes empty strings
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key 
ON auth.users (phone, instance_id)
WHERE phone != '';

-- Update the auth user creation function
CREATE OR REPLACE FUNCTION create_employee_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  temp_password text;
  new_user_id uuid;
BEGIN
  -- Validate employee data
  PERFORM validate_employee_data(NEW.email, NEW.tenant_id, NEW.ird_number);

  -- Generate UUID for new user
  new_user_id := gen_random_uuid();
  
  -- Generate temporary password
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

  -- Create auth user with all fields properly set
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_super_admin,
    is_sso_user,
    deleted_at,
    is_anonymous,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    NEW.email,
    crypt(temp_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', 'employee',
      'tenant_id', NEW.tenant_id
    ),
    'authenticated',
    'authenticated',
    '', -- phone
    NULL, -- phone_confirmed_at
    '', -- phone_change
    '', -- phone_change_token
    NULL, -- phone_change_sent_at
    '', -- confirmation_token
    NULL, -- confirmation_sent_at
    '', -- recovery_token
    NULL, -- recovery_sent_at
    '', -- email_change_token_new
    '', -- email_change
    NULL, -- email_change_sent_at
    '', -- email_change_token_current
    0, -- email_change_confirm_status
    NULL, -- banned_until
    '', -- reauthentication_token
    NULL, -- reauthentication_sent_at
    false, -- is_super_admin
    false, -- is_sso_user
    NULL, -- deleted_at
    false, -- is_anonymous
    now(), -- created_at
    now(), -- updated_at
    NULL  -- last_sign_in_at
  );

  -- Set the user_id on the employee profile
  NEW.user_id := new_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;