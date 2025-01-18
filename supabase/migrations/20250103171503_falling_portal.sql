/*
  # Fix Employee Management Policies

  1. Changes
    - Add policies for employee profile management
    - Fix user_id handling in employee creation
    - Add function to generate temporary passwords
    - Add trigger to handle auth user creation

  2. Security
    - Enable RLS on employee_profiles
    - Add policies for tenant-scoped access
    - Add policies for role-based management
*/

-- Create function to generate secure temporary passwords
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS text AS $$
BEGIN
  RETURN 'temp-' || encode(gen_random_bytes(12), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create auth user for employee
CREATE OR REPLACE FUNCTION create_employee_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  temp_password text;
  new_user_id uuid;
BEGIN
  -- Generate temporary password
  temp_password := generate_temp_password();

  -- Create auth user
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
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
  )
  RETURNING id INTO new_user_id;

  -- Update employee profile with new user_id
  NEW.user_id = new_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_auth_user_trigger ON employee_profiles;

-- Create new trigger for employee creation
CREATE TRIGGER create_auth_user_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  WHEN (NEW.user_id IS NULL OR NEW.user_id = '00000000-0000-0000-0000-000000000000')
  EXECUTE FUNCTION create_employee_auth_user();

-- Drop existing policies
DROP POLICY IF EXISTS "manage_employee_profiles" ON employee_profiles;
DROP POLICY IF EXISTS "view_employee_profiles" ON employee_profiles;

-- Create new policies for employee_profiles
CREATE POLICY "employee_profiles_select"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

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
GRANT EXECUTE ON FUNCTION generate_temp_password() TO authenticated;
GRANT EXECUTE ON FUNCTION create_employee_auth_user() TO authenticated;