/*
  # Improve Email Validation

  1. Changes
    - Add function to check email existence across tables
    - Update employee creation process to use improved validation
    - Add better error messages for email conflicts
*/

-- Create a function to check email existence
CREATE OR REPLACE FUNCTION check_email_availability(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  email_exists boolean;
BEGIN
  -- Check auth.users table
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) INTO email_exists;

  IF email_exists THEN
    RETURN false;
  END IF;

  -- Check employee_profiles table
  SELECT EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) INTO email_exists;

  RETURN NOT email_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auth user creation function
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Check email availability
  IF NOT check_email_availability(p_email, p_tenant_id) THEN
    RAISE EXCEPTION 'Email is already in use';
  END IF;

  -- Generate UUID and temporary password
  new_user_id := gen_random_uuid();
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

  -- Create auth user
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
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(temp_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', p_role,
      'tenant_id', p_tenant_id
    ),
    'authenticated',
    'authenticated',
    '',
    now(),
    now()
  );

  -- Create public user record
  INSERT INTO users (
    id,
    email,
    role,
    tenant_id,
    is_verified
  ) VALUES (
    new_user_id,
    p_email,
    p_role,
    p_tenant_id,
    true
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check email availability
  IF NOT check_email_availability(NEW.email, NEW.tenant_id) THEN
    RAISE EXCEPTION 'Email is already in use';
  END IF;

  -- Check IRD number
  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = NEW.ird_number
    AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'IRD number already exists within tenant';
  END IF;

  -- Create auth user and get ID
  BEGIN
    NEW.user_id := create_auth_user(NEW.email, NEW.tenant_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user account: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_email_availability(text, uuid, uuid) TO authenticated;