-- Drop and recreate the auth user creation function with better error handling
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Check if email already exists in auth.users
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'Email already exists in authentication system';
  END IF;

  -- Generate UUID and temporary password
  new_user_id := gen_random_uuid();
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

  -- Create auth user with explicit defaults for all fields
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
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    is_super_admin,
    is_sso_user,
    deleted_at,
    is_anonymous,
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
    '', -- phone
    '', -- confirmation_token
    '', -- recovery_token
    '', -- email_change_token_new
    '', -- email_change
    '', -- email_change_token_current
    0,  -- email_change_confirm_status
    NULL, -- banned_until
    '', -- reauthentication_token
    false, -- is_super_admin
    false, -- is_sso_user
    NULL, -- deleted_at
    false, -- is_anonymous
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
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Email already exists';
WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the employee insert trigger
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check email availability first
  PERFORM check_email_availability(NEW.email, NEW.tenant_id);

  -- Create auth user and get ID
  BEGIN
    NEW.user_id := create_auth_user(NEW.email, NEW.tenant_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user account: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION create_auth_user(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION before_employee_insert() TO authenticated;