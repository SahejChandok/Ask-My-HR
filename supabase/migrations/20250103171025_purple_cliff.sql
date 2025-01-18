/*
  # Fix Employee Creation Process

  1. Changes
    - Add trigger to handle user creation
    - Update employee profile policies
    - Add function to create auth users

  2. Security
    - Ensure proper tenant isolation
    - Handle user creation securely
*/

-- Create function to create auth user
CREATE OR REPLACE FUNCTION create_employee_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
BEGIN
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
    crypt('temp-' || gen_random_uuid()::text, gen_salt('bf')),
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

-- Create trigger for new employees
DROP TRIGGER IF EXISTS create_auth_user_trigger ON employee_profiles;
CREATE TRIGGER create_auth_user_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  WHEN (NEW.user_id = '00000000-0000-0000-0000-000000000000')
  EXECUTE FUNCTION create_employee_auth_user();

-- Update employee profile policies
DROP POLICY IF EXISTS "manage_employee_profiles" ON employee_profiles;
CREATE POLICY "manage_employee_profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
    )
  );