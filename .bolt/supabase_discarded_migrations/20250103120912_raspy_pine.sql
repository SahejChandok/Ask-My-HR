/*
  # Add payroll tables

  1. New Tables
    - `payroll_runs`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `period_start` (date)
      - `period_end` (date)
      - `processed_by` (uuid, foreign key)
      - `status` (enum)
      - timestamps

    - `payslips`
      - `id` (uuid, primary key)
      - `payroll_run_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `gross_pay` (numeric)
      - `kiwisaver_deduction` (numeric)
      - `employer_kiwisaver` (numeric)
      - `paye_tax` (numeric)
      - `net_pay` (numeric)
      - timestamps

  2. Security
    - Enable RLS on both tables
    - Add policies for payroll admins and employees
*/

-- Create payroll status enum
CREATE TYPE payroll_status AS ENUM (
  'draft',
  'processing',
  'completed',
  'cancelled'
);

-- Create payroll runs table
CREATE TABLE payroll_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  processed_by uuid REFERENCES users(id) NOT NULL,
  status payroll_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Create payslips table
CREATE TABLE payslips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id uuid REFERENCES payroll_runs(id) NOT NULL,
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  gross_pay numeric(10,2) NOT NULL,
  kiwisaver_deduction numeric(10,2) NOT NULL,
  employer_kiwisaver numeric(10,2) NOT NULL,
  paye_tax numeric(10,2) NOT NULL,
  net_pay numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Payroll run policies
CREATE POLICY "Payroll admins can manage payroll runs"
  ON payroll_runs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = payroll_runs.tenant_id
      AND users.role IN ('tenant_admin', 'payroll_admin')
    )
  );

-- Payslip policies
CREATE POLICY "Employees can view their own payslips"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles ep
      WHERE ep.id = payslips.employee_id
      AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Payroll admins can manage payslips"
  ON payslips
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payroll_runs pr
      JOIN users u ON u.tenant_id = pr.tenant_id
      WHERE pr.id = payslips.payroll_run_id
      AND u.id = auth.uid()
      AND u.role IN ('tenant_admin', 'payroll_admin')
    )
  );

-- Create indexes
CREATE INDEX idx_payroll_runs_tenant_id ON payroll_runs(tenant_id);
CREATE INDEX idx_payroll_runs_period ON payroll_runs(period_start, period_end);
CREATE INDEX idx_payslips_payroll_run_id ON payslips(payroll_run_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);