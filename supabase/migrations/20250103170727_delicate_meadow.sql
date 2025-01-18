/*
  # Fix Employee RLS Policies

  1. Changes
    - Drop existing problematic policies
    - Add new policies for employee management
    - Grant proper permissions for employee operations

  2. Security
    - Ensure proper tenant isolation
    - Allow admins to manage employees
    - Employees can view their own profiles
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "employee_profiles_tenant_access" ON employee_profiles;
DROP POLICY IF EXISTS "Users can view employee profiles in tenant" ON employee_profiles;
DROP POLICY IF EXISTS "Users can view own employee profile" ON employee_profiles;

-- Create new policies for employee_profiles

-- Allow users to view employee profiles in their tenant
CREATE POLICY "view_employee_profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id()
  );

-- Allow admins to insert new employees
CREATE POLICY "insert_employee_profiles"
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

-- Allow admins to update employee profiles
CREATE POLICY "update_employee_profiles"
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

-- Allow admins to delete employee profiles
CREATE POLICY "delete_employee_profiles"
  ON employee_profiles
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin')
    )
  );

-- Grant necessary permissions
GRANT ALL ON employee_profiles TO authenticated;