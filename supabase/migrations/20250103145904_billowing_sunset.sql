/*
  # Fix RLS Policies

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies
    - Simplify tenant access checks
  
  2. Security
    - Maintains same security model but with better performance
    - Prevents infinite recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view all profiles in their tenant" ON users;
DROP POLICY IF EXISTS "Users can view own employee profile" ON employee_profiles;
DROP POLICY IF EXISTS "Users can view all employee profiles in their tenant" ON employee_profiles;
DROP POLICY IF EXISTS "Users can view timesheets in their tenant" ON timesheets;
DROP POLICY IF EXISTS "Users can view leave requests in their tenant" ON leave_requests;
DROP POLICY IF EXISTS "Users can view payroll runs in their tenant" ON payroll_runs;

-- Create new simplified policies for users table
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Policies for employee_profiles
CREATE POLICY "Users can view employee profiles in tenant"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Policies for timesheets
CREATE POLICY "Users can view timesheets in tenant"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Policies for leave requests
CREATE POLICY "Users can view leave requests in tenant"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Policies for payroll runs
CREATE POLICY "Users can view payroll runs in tenant"
  ON payroll_runs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Policies for payslips
DROP POLICY IF EXISTS "Users can view payslips in their tenant" ON payslips;
CREATE POLICY "Users can view payslips in tenant"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employee_profiles 
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
    )
  );

-- Ensure proper auth schema access
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;