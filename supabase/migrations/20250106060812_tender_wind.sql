-- Add auto-filing fields to ird_filing_config if they don't exist
ALTER TABLE ird_filing_config
ADD COLUMN IF NOT EXISTS auto_file boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS file_on_day integer CHECK (file_on_day BETWEEN 1 AND 5);

-- Create function to validate IRD number if it doesn't exist
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

-- Create function to generate IR348 data if it doesn't exist
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_ird_number(text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ir348_data(uuid) TO authenticated;