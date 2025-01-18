-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;
DROP FUNCTION IF EXISTS before_employee_insert() CASCADE;
DROP FUNCTION IF EXISTS validate_employee_data(text, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_employee_data(text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS create_auth_user(text, uuid, text) CASCADE;

-- Create function to validate employee data with explicit type casting
CREATE OR REPLACE FUNCTION validate_employee_data(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Basic format validation
  IF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Please enter a valid email address'
    );
  END IF;

  -- Check if email exists in auth.users for a different tenant
  SELECT au.id, u.tenant_id
  INTO existing_user
  FROM auth.users au
  JOIN users u ON au.id = u.id
  WHERE au.email = p_email
  AND u.tenant_id != p_tenant_id::uuid
  LIMIT 1;

  IF existing_user.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Email address is already registered to another organization'
    );
  END IF;

  -- Check for existing email in employee_profiles within same tenant
  IF EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id::uuid
    AND (p_exclude_id IS NULL OR id != p_exclude_id::uuid)
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Email address is already in use within your organization'
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create auth user with explicit type casting
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
  role_val role_type;
BEGIN
  -- Validate and convert role
  BEGIN
    role_val := p_role::role_type;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid role type. Must be one of: platform_admin, tenant_admin, employee, hr_manager, payroll_admin';
  END;

  -- Generate UUID and password
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
    CASE WHEN current_setting('app.settings.development', true) = 'true' 
         THEN now() 
         ELSE NULL 
    END,
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', role_val,
      'tenant_id', p_tenant_id::uuid
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
    role_val,
    p_tenant_id::uuid,
    current_setting('app.settings.development', true) = 'true'
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create employee insert trigger function with explicit type casting
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
DECLARE
  validation jsonb;
BEGIN
  -- Validate email
  validation := validate_employee_data(NEW.email::text, NEW.tenant_id::uuid);
  IF NOT (validation->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation->>'message';
  END IF;

  -- Create auth user and get ID
  NEW.user_id := create_auth_user(NEW.email::text, NEW.tenant_id::uuid, 'employee'::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_employee_data(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_auth_user(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION before_employee_insert() TO authenticated;