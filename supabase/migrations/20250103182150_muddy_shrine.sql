-- Drop trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;

-- Drop functions in reverse dependency order
DROP FUNCTION IF EXISTS public.before_employee_insert();
DROP FUNCTION IF EXISTS public.create_auth_user(text, uuid, text);
DROP FUNCTION IF EXISTS public.validate_employee_email(text, uuid, text);

-- Create email validation function
CREATE OR REPLACE FUNCTION public.validate_employee_email(
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

  -- Check if email exists in auth.users
  SELECT au.id, u.tenant_id
  INTO existing_user
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE au.email = p_email
  LIMIT 1;

  IF existing_user.id IS NOT NULL THEN
    -- If email exists in another tenant
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

  -- Check for existing email in employee_profiles within same tenant
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

-- Create auth user function
CREATE OR REPLACE FUNCTION public.create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Generate UUID and temporary password
  new_user_id := gen_random_uuid();
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

  -- Create auth user first
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
    current_setting('app.settings.development', true) = 'true'
  );

  RETURN new_user_id;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Failed to create user: Email already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create employee insert trigger function
CREATE OR REPLACE FUNCTION public.before_employee_insert()
RETURNS TRIGGER AS $$
DECLARE
  validation jsonb;
BEGIN
  -- Validate email
  validation := validate_employee_email(NEW.email, NEW.tenant_id);
  IF NOT (validation->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation->>'message';
  END IF;

  -- Create auth user and get ID
  BEGIN
    NEW.user_id := create_auth_user(NEW.email, NEW.tenant_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.validate_employee_email(text, uuid, uuid) TO authenticated;