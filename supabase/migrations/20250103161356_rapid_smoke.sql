-- Add policies for timesheet management
CREATE POLICY "timesheets_insert_own"
  ON timesheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (employee_id IN (
      SELECT id FROM employee_profiles WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    ))
    AND
    tenant_id = get_auth_tenant_id()
  );

-- Add policies for timesheet entries
CREATE POLICY "timesheet_entries_insert_own"
  ON timesheet_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    timesheet_id IN (
      SELECT id FROM timesheets
      WHERE tenant_id = get_auth_tenant_id()
      AND (
        employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
        OR
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
        )
      )
    )
  );

-- Add policies for payroll processing
CREATE POLICY "payroll_runs_process"
  ON payroll_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id()
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;