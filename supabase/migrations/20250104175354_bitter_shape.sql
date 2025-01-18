-- Drop existing functions first
DROP FUNCTION IF EXISTS validate_employee_data(text, uuid, text);
DROP FUNCTION IF EXISTS validate_employee_data(text, uuid, uuid);

-- Create function to validate employee data
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
  AND u.tenant_id != p_tenant_id
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

-- Update employee insert trigger function
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
DECLARE
  validation jsonb;
BEGIN
  -- Validate email
  validation := validate_employee_data(NEW.email, NEW.tenant_id, NULL::uuid);
  IF NOT (validation->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation->>'message';
  END IF;

  -- Create auth user and get ID
  NEW.user_id := create_auth_user(NEW.email, NEW.tenant_id, 'employee');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_employee_data(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION before_employee_insert() TO authenticated;