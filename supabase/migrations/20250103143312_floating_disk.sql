/*
  # Fix authentication setup

  1. Security
    - Add policies for auth schema
    - Grant necessary permissions
    - Add policies for public schema tables
*/

-- Grant permissions on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;

-- Add policies for auth.users
CREATE POLICY "Allow public access to auth.users"
  ON auth.users
  FOR SELECT
  TO public
  USING (true);

-- Add broader policies for authenticated users
CREATE POLICY "Users can view all profiles in their tenant"
  ON users
  FOR SELECT
  TO authenticated
  USING (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view all employee profiles in their tenant"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

-- Add policies for timesheet access
CREATE POLICY "Users can view timesheets in their tenant"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

-- Add policies for leave requests
CREATE POLICY "Users can view leave requests in their tenant"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

-- Add policies for payroll access
CREATE POLICY "Users can view payroll runs in their tenant"
  ON payroll_runs
  FOR SELECT
  TO authenticated
  USING (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

-- Add policies for payslip access
CREATE POLICY "Users can view payslips in their tenant"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (employee_id IN (
    SELECT id 
    FROM employee_profiles 
    WHERE tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  ));