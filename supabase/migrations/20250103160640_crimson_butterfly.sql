/*
  # Add Payroll RLS Policies

  1. Changes
    - Add INSERT policy for payroll_runs table
    - Add INSERT policy for payslips table
    - Update SELECT policies to use non-recursive tenant check
  
  2. Security
    - Only authenticated users can insert payroll runs for their tenant
    - Only payroll admins and tenant admins can process payroll
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "tenant_access" ON payroll_runs;
DROP POLICY IF EXISTS "tenant_member_access" ON payroll_runs;

-- Create new policies for payroll_runs
CREATE POLICY "payroll_runs_select"
  ON payroll_runs
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "payroll_runs_insert"
  ON payroll_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = get_auth_tenant_id() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'tenant_admin', 'payroll_admin')
    )
  );

-- Add policies for payslips
CREATE POLICY "payslips_insert"
  ON payslips
  FOR INSERT
  TO authenticated
  WITH CHECK (
    payroll_run_id IN (
      SELECT id 
      FROM payroll_runs 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );