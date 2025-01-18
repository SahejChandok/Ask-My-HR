-- Create function to validate employee data with optimized checks
CREATE OR REPLACE FUNCTION validate_employee_data(
  p_email text,
  p_tenant_id uuid,
  p_ird_number text
) RETURNS boolean AS $$
DECLARE
  existing_email boolean;
  existing_ird boolean;
BEGIN
  -- Check for duplicate email within tenant
  SELECT EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE email = p_email
    AND tenant_id = p_tenant_id
    LIMIT 1
  ) INTO existing_email;

  IF existing_email THEN
    RAISE EXCEPTION 'Email already exists within tenant';
  END IF;

  -- Check for duplicate IRD number within tenant
  SELECT EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = p_ird_number
    AND tenant_id = p_tenant_id
    LIMIT 1
  ) INTO existing_ird;

  IF existing_ird THEN
    RAISE EXCEPTION 'IRD number already exists within tenant';
  END IF;

  -- Check if email exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = p_email
    LIMIT 1
  ) INTO existing_email;

  IF existing_email THEN
    RAISE EXCEPTION 'Email already exists in authentication system';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create optimized function to create auth user
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Generate UUID and temporary password
  new_user_id := gen_random_uuid();

  -- Create auth user with minimal fields
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
    crypt('temp-' || encode(gen_random_bytes(8), 'base64'), gen_salt('bf')),
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

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create optimized trigger function
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate employee data
  PERFORM validate_employee_data(NEW.email, NEW.tenant_id, NEW.ird_number);

  -- Create auth user and get ID
  NEW.user_id := create_auth_user(NEW.email, NEW.tenant_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger with error handling
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Create index to optimize email lookups
CREATE INDEX IF NOT EXISTS idx_employee_profiles_email_tenant 
ON employee_profiles(email, tenant_id);

-- Create index to optimize IRD number lookups
CREATE INDEX IF NOT EXISTS idx_employee_profiles_ird_tenant 
ON employee_profiles(ird_number, tenant_id);

-- Update RLS policies with optimized conditions
DROP POLICY IF EXISTS "employee_profiles_insert" ON employee_profiles;
DROP POLICY IF EXISTS "employee_profiles_update" ON employee_profiles;

CREATE POLICY "employee_profiles_insert"
  ON employee_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
      LIMIT 1
    )
  );

CREATE POLICY "employee_profiles_update"
  ON employee_profiles
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
      LIMIT 1
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_employee_data(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_auth_user(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION before_employee_insert() TO authenticated;