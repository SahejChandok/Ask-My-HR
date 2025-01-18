/*
  # Fix Employee Creation Process

  1. Changes
    - Update auth user creation trigger to properly generate UUIDs
    - Fix RLS policies for employee management
    - Add function to validate employee data

  2. Security
    - Ensure proper tenant isolation
    - Add role-based access control
    - Maintain data integrity
*/

-- Create function to validate employee data
CREATE OR REPLACE FUNCTION validate_employee_data(
  p_email text,
  p_tenant_id uuid,
  p_ird_number text
) RETURNS boolean AS $$
BEGIN
  -- Check for duplicate email within tenant
  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE email = p_email
    AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Email already exists within tenant';
  END IF;

  -- Check for duplicate IRD number within tenant
  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = p_ird_number
    AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'IRD number already exists within tenant';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auth user creation function
CREATE OR REPLACE FUNCTION create_employee_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  temp_password text;
  new_user_id uuid;
BEGIN
  -- Validate employee data
  PERFORM validate_employee_data(NEW.email, NEW.tenant_id, NEW.ird_number);

  -- Generate UUID for new user
  new_user_id := gen_random_uuid();
  
  -- Generate temporary password
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
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    NEW.email,
    crypt(temp_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', 'employee',
      'tenant_id', NEW.tenant_id
    ),
    'authenticated',
    'authenticated'
  );

  -- Set the user_id on the employee profile
  NEW.user_id := new_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS create_auth_user_trigger ON employee_profiles;

CREATE TRIGGER create_auth_user_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_employee_auth_user();

-- Update RLS policies
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
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_employee_data(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_employee_auth_user() TO authenticated;