-- Create function to get current user's tenant_id
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

-- Create function to check if user has HR access
CREATE OR REPLACE FUNCTION has_hr_access()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate tenant access
CREATE OR REPLACE FUNCTION validate_tenant_access(p_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user belongs to tenant
  RETURN p_tenant_id = get_auth_tenant_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update payroll_settings policies to use new functions
DROP POLICY IF EXISTS "tenant_select_policy" ON payroll_settings;
DROP POLICY IF EXISTS "tenant_insert_policy" ON payroll_settings;
DROP POLICY IF EXISTS "tenant_update_policy" ON payroll_settings;

CREATE POLICY "tenant_select_policy" ON payroll_settings
  FOR SELECT TO authenticated
  USING (validate_tenant_access(tenant_id));

CREATE POLICY "tenant_insert_policy" ON payroll_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    validate_tenant_access(tenant_id) AND
    has_payroll_access()
  );

CREATE POLICY "tenant_update_policy" ON payroll_settings
  FOR UPDATE TO authenticated
  USING (
    validate_tenant_access(tenant_id) AND
    has_payroll_access()
  );

-- Update payroll_runs policies
DROP POLICY IF EXISTS "tenant_select_policy" ON payroll_runs;
DROP POLICY IF EXISTS "tenant_insert_policy" ON payroll_runs;
DROP POLICY IF EXISTS "tenant_update_policy" ON payroll_runs;

CREATE POLICY "tenant_select_policy" ON payroll_runs
  FOR SELECT TO authenticated
  USING (validate_tenant_access(tenant_id));

CREATE POLICY "tenant_insert_policy" ON payroll_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    validate_tenant_access(tenant_id) AND
    has_payroll_access()
  );

CREATE POLICY "tenant_update_policy" ON payroll_runs
  FOR UPDATE TO authenticated
  USING (
    validate_tenant_access(tenant_id) AND
    has_payroll_access()
  );

-- Update employee_profiles policies
DROP POLICY IF EXISTS "tenant_select_policy" ON employee_profiles;
DROP POLICY IF EXISTS "tenant_insert_policy" ON employee_profiles;
DROP POLICY IF EXISTS "tenant_update_policy" ON employee_profiles;

CREATE POLICY "tenant_select_policy" ON employee_profiles
  FOR SELECT TO authenticated
  USING (validate_tenant_access(tenant_id));

CREATE POLICY "tenant_insert_policy" ON employee_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    validate_tenant_access(tenant_id) AND
    has_hr_access()
  );

CREATE POLICY "tenant_update_policy" ON employee_profiles
  FOR UPDATE TO authenticated
  USING (
    validate_tenant_access(tenant_id) AND
    has_hr_access()
  );

-- Update leave_requests policies
DROP POLICY IF EXISTS "tenant_select_policy" ON leave_requests;
DROP POLICY IF EXISTS "tenant_insert_policy" ON leave_requests;
DROP POLICY IF EXISTS "tenant_update_policy" ON leave_requests;

CREATE POLICY "tenant_select_policy" ON leave_requests
  FOR SELECT TO authenticated
  USING (validate_tenant_access(tenant_id));

CREATE POLICY "tenant_insert_policy" ON leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    validate_tenant_access(tenant_id) AND (
      -- Allow employees to create their own leave requests
      employee_id IN (
        SELECT id FROM employee_profiles
        WHERE user_id = auth.uid()
      ) OR
      -- Allow HR access to create leave requests
      has_hr_access()
    )
  );

CREATE POLICY "tenant_update_policy" ON leave_requests
  FOR UPDATE TO authenticated
  USING (
    validate_tenant_access(tenant_id) AND (
      -- Allow employees to update their own pending leave requests
      (
        employee_id IN (
          SELECT id FROM employee_profiles
          WHERE user_id = auth.uid()
        ) AND
        status = 'pending'
      ) OR
      -- Allow HR access to update any leave request
      has_hr_access()
    )
  );

-- Create test helper functions
CREATE OR REPLACE FUNCTION test_tenant_access(p_tenant_id uuid)
RETURNS TABLE (
  has_access boolean,
  auth_tenant_id uuid,
  has_payroll_access boolean,
  has_hr_access boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    validate_tenant_access(p_tenant_id),
    get_auth_tenant_id(),
    has_payroll_access(),
    has_hr_access();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_auth_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION has_payroll_access() TO authenticated;
GRANT EXECUTE ON FUNCTION has_hr_access() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_tenant_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION test_tenant_access(uuid) TO authenticated;