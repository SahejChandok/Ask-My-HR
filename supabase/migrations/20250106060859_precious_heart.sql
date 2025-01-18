-- Drop existing tables if they exist
DROP TABLE IF EXISTS ird_filing_details CASCADE;
DROP TABLE IF EXISTS ird_filings CASCADE;
DROP TABLE IF EXISTS ird_filing_config CASCADE;

-- Create IRD filing configuration table
CREATE TABLE ird_filing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  ird_number varchar(9) NOT NULL,
  filing_frequency text CHECK (filing_frequency IN ('monthly', 'twice-monthly', 'payday')),
  auto_file boolean DEFAULT false,
  file_on_day integer CHECK (file_on_day BETWEEN 1 AND 5),
  last_filing_date date,
  next_filing_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_tenant_config UNIQUE (tenant_id)
);

-- Create IRD filing history table
CREATE TABLE ird_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  payroll_run_id uuid REFERENCES payroll_runs(id),
  filing_type text NOT NULL CHECK (filing_type IN ('ir348', 'ei')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected')),
  submission_date timestamptz,
  response_data jsonb,
  error_details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create IRD filing details table
CREATE TABLE ird_filing_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filing_id uuid REFERENCES ird_filings(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employee_profiles(id),
  pay_code text NOT NULL,
  gross_earnings numeric(10,2) NOT NULL,
  paye_deducted numeric(10,2) NOT NULL,
  kiwisaver_deductions numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ird_filing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ird_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ird_filing_details ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "tenant_access" ON ird_filing_config
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_access" ON ird_filings
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_access" ON ird_filing_details
  FOR ALL
  TO authenticated
  USING (filing_id IN (
    SELECT id FROM ird_filings WHERE tenant_id = get_auth_tenant_id()
  ));

-- Create function to calculate next filing date
CREATE OR REPLACE FUNCTION calculate_next_filing_date(
  p_last_date date,
  p_frequency text
) RETURNS date AS $$
DECLARE
  v_next_date date;
BEGIN
  v_next_date := p_last_date;
  
  CASE p_frequency
    WHEN 'monthly' THEN
      v_next_date := v_next_date + interval '1 month';
    WHEN 'twice-monthly' THEN
      IF extract(day from p_last_date) <= 15 THEN
        v_next_date := date_trunc('month', p_last_date) + interval '15 days';
      ELSE
        v_next_date := date_trunc('month', p_last_date) + interval '1 month';
      END IF;
    WHEN 'payday' THEN
      v_next_date := v_next_date + interval '14 days';
  END CASE;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update filing dates
CREATE OR REPLACE FUNCTION update_filing_dates()
RETURNS void AS $$
BEGIN
  UPDATE ird_filing_config
  SET next_filing_date = calculate_next_filing_date(last_filing_date, filing_frequency)
  WHERE last_filing_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to submit IRD filing
CREATE OR REPLACE FUNCTION submit_ird_filing(
  p_payroll_run_id uuid,
  p_filing_type text
) RETURNS uuid AS $$
DECLARE
  v_filing_id uuid;
  v_run record;
BEGIN
  -- Get payroll run details
  SELECT * INTO v_run
  FROM payroll_runs
  WHERE id = p_payroll_run_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run not found';
  END IF;

  -- Create filing record
  INSERT INTO ird_filings (
    tenant_id,
    payroll_run_id,
    filing_type,
    period_start,
    period_end,
    status
  ) VALUES (
    v_run.tenant_id,
    p_payroll_run_id,
    p_filing_type,
    v_run.period_start,
    v_run.period_end,
    'pending'
  ) RETURNING id INTO v_filing_id;

  -- Create filing details
  INSERT INTO ird_filing_details (
    filing_id,
    employee_id,
    pay_code,
    gross_earnings,
    paye_deducted,
    kiwisaver_deductions
  )
  SELECT 
    v_filing_id,
    p.employee_id,
    CASE 
      WHEN e.employment_type = 'salary' THEN 'SA'
      ELSE 'WG'
    END,
    p.gross_pay,
    p.paye_tax,
    p.kiwisaver_deduction
  FROM payslips p
  JOIN employee_profiles e ON p.employee_id = e.id
  WHERE p.payroll_run_id = p_payroll_run_id;

  RETURN v_filing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON ird_filing_config TO authenticated;
GRANT ALL ON ird_filings TO authenticated;
GRANT ALL ON ird_filing_details TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_filing_date(date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_filing_dates() TO authenticated;
GRANT EXECUTE ON FUNCTION submit_ird_filing(uuid, text) TO authenticated;