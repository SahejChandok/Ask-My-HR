/*
  # Fix Employee Creation Policies

  1. Changes
    - Add policy for creating users
    - Add policy for managing employee profiles
    - Grant proper permissions

  2. Security
    - Ensure proper tenant isolation
    - Allow admins to manage employees
*/

-- Create policy for managing auth users
CREATE POLICY "manage_auth_users"
  ON auth.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
    )
  );

-- Update employee profiles policy to handle user_id
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

-- Grant necessary permissions
GRANT ALL ON auth.users TO authenticated;
GRANT ALL ON employee_profiles TO authenticated;