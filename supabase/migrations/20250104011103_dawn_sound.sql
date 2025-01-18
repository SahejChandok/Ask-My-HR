-- Drop existing functions first
DROP FUNCTION IF EXISTS create_auth_user(text, uuid, text);
DROP FUNCTION IF EXISTS create_auth_user(text, uuid, role_type);

-- Create helper function to validate role type
CREATE OR REPLACE FUNCTION validate_role_type(p_role text)
RETURNS role_type AS $$
BEGIN
  RETURN p_role::role_type;
EXCEPTION WHEN invalid_text_representation THEN
  RAISE EXCEPTION 'Invalid role type. Must be one of: platform_admin, tenant_admin, employee, hr_manager, payroll_admin';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to create auth user and return ID
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
  role_val := validate_role_type(p_role);

  -- Check if email exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email address is already in use';
  END IF;

  -- Generate UUID and password
  new_user_id := gen_random_uuid();
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

  -- Create auth user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, phone, created_at, updated_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(temp_password, gen_salt('bf')),
    CASE WHEN current_setting('app.settings.development', true) = 'true' 
         THEN now() ELSE NULL END,
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', role_val, 'tenant_id', p_tenant_id),
    'authenticated',
    'authenticated',
    '',
    now(),
    now()
  );

  -- Create public user record
  INSERT INTO users (
    id, email, role, tenant_id, is_verified
  ) VALUES (
    new_user_id,
    p_email,
    role_val,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_role_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_auth_user(text, uuid, text) TO authenticated;