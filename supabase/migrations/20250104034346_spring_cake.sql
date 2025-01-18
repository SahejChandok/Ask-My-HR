-- Drop existing table if it exists
DROP TABLE IF EXISTS payroll_calculation_logs CASCADE;

-- Create table for payroll calculation logs
CREATE TABLE payroll_calculation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id),
  log_type text NOT NULL CHECK (log_type IN (
    'timesheet_summary',
    'salary_calculation',
    'hourly_calculation',
    'kiwisaver_calculation',
    'tax_calculation',
    'final_calculation'
  )),
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_payroll_logs_run_employee ON payroll_calculation_logs(payroll_run_id, employee_id);
CREATE INDEX idx_payroll_logs_type ON payroll_calculation_logs(log_type);

-- Enable RLS on logs table
ALTER TABLE payroll_calculation_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for logs
CREATE POLICY "tenant_access_policy" ON payroll_calculation_logs
  FOR ALL
  TO authenticated
  USING (
    payroll_run_id IN (
      SELECT id FROM payroll_runs 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );

-- Grant necessary permissions
GRANT ALL ON payroll_calculation_logs TO authenticated;