/*
  # Fix email validation and user creation

  1. Changes
    - Improve email validation to check both auth.users and employee_profiles
    - Add better error handling for duplicate emails
    - Fix user creation to handle existing auth users
    - Add proper transaction handling

  2. Security
    - Maintain RLS policies
    - Keep security definer functions
*/

-- Create a function to validate email comprehensively
CREATE OR REPLACE FUNCTION validate_employee_email(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
  existing_user RECORD;
BEGIN
  -- Check auth.users first
  SELECT au.id, u.tenant_id, u.role
  INTO existing_user
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE au.email = p_email
  LIMIT 1;

  IF existing_user.id IS NOT NULL THEN
    -- If user exists in another tenant
    IF existing_user.tenant_id != p_tenant_id THEN
      RETURN jsonb_build_object(
        'valid', false,
        'message', 'Email address is already registered to another organization'
      );
    END IF;
    
    -- If updating existing employee, allow same email
    IF p_exclude_id IS NOT NULL AND 
       EXISTS (
         SELECT 1 FROM employee_profiles 
         WHERE id = p_exclude_id AND email = p_email
       ) THEN
      RETURN jsonb_build_object('valid', true);
    END IF;
  END IF;

  -- Check employee_profiles within tenant
  IF EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Email address is already in use within your organization'
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get or create auth user
CREATE OR REPLACE FUNCTION get_or_create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  existing_user_id uuid;
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = p_email;

  IF existing_user_id IS NOT NULL THEN
    RETURN existing_user_id;
  END IF;

  -- Create new auth user
  new_user_id := gen_random_uuid();
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

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

-- Update the employee insert trigger
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
DECLARE
  validation_result jsonb;
BEGIN
  -- Validate email
  validation_result := validate_employee_email(NEW.email, NEW.tenant_id);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation_result->>'message';
  END IF;

  -- Get or create auth user
  NEW.user_id := get_or_create_auth_user(NEW.email, NEW.tenant_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;

-- Create new trigger
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_employee_email(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_auth_user(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION before_employee_insert() TO authenticated;