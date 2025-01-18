-- Create a function to validate email format
CREATE OR REPLACE FUNCTION validate_email_format(p_email text)
RETURNS boolean AS $$
BEGIN
  RETURN p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the email validation function
CREATE OR REPLACE FUNCTION validate_employee_email(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Validate email format
  IF NOT validate_email_format(p_email) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid email format'
    );
  END IF;

  -- Check auth.users first
  IF EXISTS (
    SELECT 1 FROM auth.users au
    JOIN users u ON au.id = u.id
    WHERE au.email = p_email
    AND u.tenant_id != p_tenant_id
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Email address is already registered to another organization'
    );
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

-- Update the employee creation function
CREATE OR REPLACE FUNCTION create_employee_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Validate email format
  IF NOT validate_email_format(p_email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Check for existing email
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'Email already exists';
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
    phone
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
      'role', p_role,
      'tenant_id', p_tenant_id
    ),
    'authenticated',
    'authenticated',
    ''
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
    current_setting('app.settings.development', true) = 'true'
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;