-- Create a function to validate email format and availability
CREATE OR REPLACE FUNCTION public.validate_employee_email(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  validation jsonb;
BEGIN
  -- Basic format validation
  IF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Please enter a valid email address'
    );
  END IF;

  -- Check for existing email in auth.users for different tenant
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

-- Update the employee insert trigger
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
DECLARE
  validation jsonb;
BEGIN
  -- Validate email
  validation := validate_employee_email(NEW.email, NEW.tenant_id);
  IF NOT (validation->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation->>'message';
  END IF;

  -- Check IRD number format
  IF NOT NEW.ird_number ~ '^\d{9}$' THEN
    RAISE EXCEPTION 'IRD number must be exactly 9 digits';
  END IF;

  -- Check for duplicate IRD number
  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = NEW.ird_number
    AND tenant_id = NEW.tenant_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  ) THEN
    RAISE EXCEPTION 'This IRD number is already registered to another employee';
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

-- Drop existing trigger
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;

-- Create new trigger
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.validate_employee_email(text, uuid, uuid) TO authenticated;