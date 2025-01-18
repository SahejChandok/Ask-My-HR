-- Create a function to safely get user's tenant ID
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT tenant_id
    FROM users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "tenant_member_access" ON users;
DROP POLICY IF EXISTS "tenant_member_access" ON employee_profiles;
DROP POLICY IF EXISTS "tenant_member_access" ON timesheets;
DROP POLICY IF EXISTS "tenant_member_access" ON leave_requests;
DROP POLICY IF EXISTS "tenant_member_access" ON leave_balances;
DROP POLICY IF EXISTS "tenant_member_access" ON payroll_runs;
DROP POLICY IF EXISTS "tenant_member_access" ON payslips;

-- Create new non-recursive policies using the security definer function
CREATE POLICY "users_tenant_access"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "employee_profiles_tenant_access"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "timesheets_tenant_access"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "leave_requests_tenant_access"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "leave_balances_tenant_access"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "payroll_runs_tenant_access"
  ON payroll_runs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "payslips_tenant_access"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id 
      FROM employee_profiles 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );

-- Add insert/update policies for employee data
CREATE POLICY "timesheets_insert"
  ON timesheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "leave_requests_insert"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id()
  );

CREATE POLICY "timesheet_entries_insert"
  ON timesheet_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    timesheet_id IN (
      SELECT id 
      FROM timesheets 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_auth_tenant_id() TO authenticated;