-- Create function to check if user has payroll access
CREATE OR REPLACE FUNCTION has_payroll_access()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update payroll_runs policies
DROP POLICY IF EXISTS "payroll_runs_select" ON payroll_runs;
DROP POLICY IF EXISTS "payroll_runs_insert" ON payroll_runs;

CREATE POLICY "payroll_runs_select"
  ON payroll_runs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    has_payroll_access()
  );

CREATE POLICY "payroll_runs_insert"
  ON payroll_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND
    has_payroll_access()
  );

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION has_payroll_access() TO authenticated;