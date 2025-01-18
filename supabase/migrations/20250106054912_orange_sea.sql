-- Create IRD filing configuration table
CREATE TABLE ird_filing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  ird_number varchar(9) NOT NULL,
  filing_frequency text CHECK (filing_frequency IN ('monthly', 'twice-monthly', 'payday')),
  last_filing_date date,
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

-- Create function to validate IRD number
CREATE OR REPLACE FUNCTION validate_ird_number(p_ird_number text)
RETURNS boolean AS $$
DECLARE
  v_weights integer[] := ARRAY[3,2,7,6,5,4,3,2];
  v_sum integer := 0;
  v_check_digit integer;
  v_remainder integer;
BEGIN
  -- Basic format check
  IF NOT p_ird_number ~ '^\d{8,9}$' THEN
    RETURN false;
  END IF;

  -- Pad to 9 digits if necessary
  p_ird_number := lpad(p_ird_number, 9, '0');
  
  -- Calculate weighted sum
  FOR i IN 1..8 LOOP
    v_sum := v_sum + (v_weights[i] * (substring(p_ird_number from i for 1)::integer));
  END LOOP;

  -- Calculate check digit
  v_remainder := v_sum % 11;
  IF v_remainder = 0 THEN
    v_check_digit := 0;
  ELSE
    v_check_digit := 11 - v_remainder;
  END IF;

  -- Compare with actual check digit
  RETURN v_check_digit = substring(p_ird_number from 9 for 1)::integer;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to generate IR348 data
CREATE OR REPLACE FUNCTION generate_ir348_data(
  p_payroll_run_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_run record;
  v_filing_data jsonb;
BEGIN
  -- Get payroll run details
  SELECT * INTO v_run
  FROM payroll_runs
  WHERE id = p_payroll_run_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run not found';
  END IF;

  -- Generate filing data
  WITH employee_data AS (
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.ird_number,
      e.tax_code,
      p.gross_pay,
      p.paye_tax,
      p.kiwisaver_deduction
    FROM payslips p
    JOIN employee_profiles e ON p.employee_id = e.id
    WHERE p.payroll_run_id = p_payroll_run_id
  )
  SELECT jsonb_build_object(
    'header', jsonb_build_object(
      'period_start', v_run.period_start,
      'period_end', v_run.period_end,
      'total_paye', SUM(paye_tax),
      'total_gross', SUM(gross_pay),
      'employee_count', COUNT(*)
    ),
    'employees', jsonb_agg(
      jsonb_build_object(
        'ird_number', ird_number,
        'name', first_name || ' ' || last_name,
        'tax_code', tax_code,
        'gross_earnings', gross_pay,
        'paye_deducted', paye_tax,
        'kiwisaver_deductions', kiwisaver_deduction
      )
    )
  ) INTO v_filing_data
  FROM employee_data;

  RETURN v_filing_data;
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
  v_filing_data jsonb;
BEGIN
  -- Get payroll run details
  SELECT * INTO v_run
  FROM payroll_runs
  WHERE id = p_payroll_run_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run not found';
  END IF;

  -- Generate filing data
  v_filing_data := generate_ir348_data(p_payroll_run_id);

  -- Create filing record
  INSERT INTO ird_filings (
    tenant_id,
    payroll_run_id,
    filing_type,
    period_start,
    period_end,
    status,
    submission_date,
    response_data
  ) VALUES (
    v_run.tenant_id,
    p_payroll_run_id,
    p_filing_type,
    v_run.period_start,
    v_run.period_end,
    'pending',
    now(),
    v_filing_data
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
GRANT EXECUTE ON FUNCTION validate_ird_number(text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ir348_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_ird_filing(uuid, text) TO authenticated;