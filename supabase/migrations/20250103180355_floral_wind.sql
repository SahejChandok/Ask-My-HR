-- Drop existing functions first
DROP FUNCTION IF EXISTS public.check_email_availability(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.validate_employee_email(text, uuid, uuid);

-- Create email validation function
CREATE OR REPLACE FUNCTION public.validate_employee_email(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
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
  validation jsonb;
BEGIN
  -- Validate email
  validation := validate_employee_email(p_email, p_tenant_id);
  IF NOT (validation->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation->>'message';
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
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Email address is already in use';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user account: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.validate_employee_email(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_employee_user(text, uuid, text) TO authenticated;