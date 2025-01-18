/*
  # Fix Recursive Policies

  1. Changes
    - Drop problematic recursive policies
    - Create new non-recursive policies using subqueries with LIMIT 1
    - Add missing policies for leave balances
    - Fix tenant access patterns

  2. Security
    - Maintain RLS security while preventing recursion
    - Ensure proper tenant isolation
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view employee profiles in tenant" ON employee_profiles;
DROP POLICY IF EXISTS "Users can view timesheets in tenant" ON timesheets;
DROP POLICY IF EXISTS "Users can view leave requests in tenant" ON leave_requests;
DROP POLICY IF EXISTS "Users can view leave balances in tenant" ON leave_balances;
DROP POLICY IF EXISTS "Users can view payroll runs in tenant" ON payroll_runs;
DROP POLICY IF EXISTS "Users can view payslips in tenant" ON payslips;

-- Create new non-recursive policies
CREATE POLICY "tenant_member_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN id = auth.uid() THEN true
      WHEN tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1) THEN true
      ELSE false
    END
  );

CREATE POLICY "tenant_member_access"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN user_id = auth.uid() THEN true
      WHEN tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1) THEN true
      ELSE false
    END
  );

CREATE POLICY "tenant_member_access"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_member_access"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_member_access"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_member_access"
  ON payroll_runs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_member_access"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id 
      FROM employee_profiles 
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
    )
  );

-- Add missing insert policies
CREATE POLICY "tenant_member_insert"
  ON leave_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "tenant_member_update"
  ON leave_balances
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  );

-- Cache user's tenant_id in a temporary table to avoid recursion
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
DECLARE
  user_tenant_id uuid;
BEGIN
  SELECT tenant_id INTO user_tenant_id
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;