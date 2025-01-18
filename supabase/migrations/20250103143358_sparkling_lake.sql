/*
  # Fix authentication policies

  1. Security
    - Add missing insert/update policies
    - Fix auth schema permissions
    - Add specific tenant-based policies
*/

-- Grant additional auth schema permissions
GRANT SELECT, INSERT, UPDATE ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Add missing insert/update policies for timesheets
CREATE POLICY "Users can insert own timesheets"
  ON timesheets
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own timesheets"
  ON timesheets
  FOR UPDATE
  TO authenticated
  USING (employee_id IN (
    SELECT id 
    FROM employee_profiles 
    WHERE user_id = auth.uid()
  ));

-- Add missing insert/update policies for leave requests
CREATE POLICY "Users can insert own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (employee_id IN (
    SELECT id 
    FROM employee_profiles 
    WHERE user_id = auth.uid()
  ));

-- Add missing timesheet entries policies
CREATE POLICY "Users can insert timesheet entries"
  ON timesheet_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (timesheet_id IN (
    SELECT id 
    FROM timesheets 
    WHERE employee_id IN (
      SELECT id 
      FROM employee_profiles 
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view timesheet entries"
  ON timesheet_entries
  FOR SELECT
  TO authenticated
  USING (timesheet_id IN (
    SELECT id 
    FROM timesheets 
    WHERE tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  ));