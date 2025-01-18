-- Drop existing policies
DROP POLICY IF EXISTS "tenant_access" ON payroll_settings;
DROP POLICY IF EXISTS "tenant_access" ON payroll_runs;
DROP POLICY IF EXISTS "tenant_access" ON employee_profiles;
DROP POLICY IF EXISTS "tenant_access" ON leave_requests;

-- Enable RLS on all tenant-sensitive tables
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for payroll_settings
CREATE POLICY "tenant_select_policy" ON payroll_settings
  FOR SELECT TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_insert_policy" ON payroll_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

CREATE POLICY "tenant_update_policy" ON payroll_settings
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Create policies for payroll_runs
CREATE POLICY "tenant_select_policy" ON payroll_runs
  FOR SELECT TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_insert_policy" ON payroll_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

CREATE POLICY "tenant_update_policy" ON payroll_runs
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Create policies for employee_profiles
CREATE POLICY "tenant_select_policy" ON employee_profiles
  FOR SELECT TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_insert_policy" ON employee_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
    )
  );

CREATE POLICY "tenant_update_policy" ON employee_profiles
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
    )
  );

-- Create policies for leave_requests
CREATE POLICY "tenant_select_policy" ON leave_requests
  FOR SELECT TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_insert_policy" ON leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND (
      -- Allow employees to create their own leave requests
      employee_id IN (
        SELECT id FROM employee_profiles
        WHERE user_id = auth.uid()
      ) OR
      -- Allow admins/managers to create leave requests for any employee
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
      )
    )
  );

CREATE POLICY "tenant_update_policy" ON leave_requests
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_auth_tenant_id() AND (
      -- Allow employees to update their own pending leave requests
      (
        employee_id IN (
          SELECT id FROM employee_profiles
          WHERE user_id = auth.uid()
        ) AND
        status = 'pending'
      ) OR
      -- Allow admins/managers to update any leave request
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('platform_admin', 'tenant_admin', 'hr_manager')
      )
    )
  );

-- Grant necessary permissions
GRANT ALL ON payroll_settings TO authenticated;
GRANT ALL ON payroll_runs TO authenticated;
GRANT ALL ON employee_profiles TO authenticated;
GRANT ALL ON leave_requests TO authenticated;