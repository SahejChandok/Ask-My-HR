-- Create function to validate IRD filing data
CREATE OR REPLACE FUNCTION validate_ird_filing(
  p_payroll_run_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_run record;
  v_errors text[];
  v_warnings text[];
BEGIN
  -- Get payroll run details
  SELECT * INTO v_run
  FROM payroll_runs
  WHERE id = p_payroll_run_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Payroll run not found'
    );
  END IF;

  -- Validate employee data
  WITH employee_validation AS (
    SELECT 
      e.id,
      e.first_name || ' ' || e.last_name as name,
      e.ird_number,
      e.tax_code,
      p.gross_pay,
      p.paye_tax,
      p.kiwisaver_deduction
    FROM payslips p
    JOIN employee_profiles e ON p.employee_id = e.id
    WHERE p.payroll_run_id = p_payroll_run_id
  )
  SELECT array_agg(error) INTO v_errors
  FROM (
    SELECT 'Missing IRD number for ' || name as error
    FROM employee_validation
    WHERE ird_number IS NULL
    UNION ALL
    SELECT 'Invalid IRD number format for ' || name
    FROM employee_validation
    WHERE NOT validate_ird_number(ird_number)
    UNION ALL
    SELECT 'Missing tax code for ' || name
    FROM employee_validation
    WHERE tax_code IS NULL
  ) errors;

  -- Check for potential issues
  SELECT array_agg(warning) INTO v_warnings
  FROM (
    SELECT 'Zero PAYE tax for ' || name || ' with gross pay ' || gross_pay as warning
    FROM employee_validation
    WHERE paye_tax = 0 AND gross_pay > 0
  ) warnings;

  RETURN jsonb_build_object(
    'valid', v_errors IS NULL OR array_length(v_errors, 1) IS NULL,
    'message', CASE 
      WHEN v_errors IS NULL OR array_length(v_errors, 1) IS NULL THEN 'Validation passed'
      ELSE 'Validation failed'
    END,
    'details', jsonb_build_object(
      'errors', COALESCE(to_jsonb(v_errors), '[]'::jsonb),
      'warnings', COALESCE(to_jsonb(v_warnings), '[]'::jsonb)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check filing status
CREATE OR REPLACE FUNCTION check_filing_status(
  p_tenant_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_config record;
  v_next_date date;
  v_pending_count integer;
BEGIN
  -- Get filing config
  SELECT * INTO v_config
  FROM ird_filing_config
  WHERE tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'configured', false,
      'message', 'IRD filing not configured'
    );
  END IF;

  -- Get next filing date
  SELECT (validate_filing_schedule(
    p_tenant_id,
    v_config.filing_frequency,
    v_config.last_filing_date
  )->>'next_filing_date')::date INTO v_next_date;

  -- Get count of pending filings
  SELECT COUNT(*) INTO v_pending_count
  FROM ird_filings
  WHERE tenant_id = p_tenant_id
  AND status = 'pending';

  RETURN jsonb_build_object(
    'configured', true,
    'next_filing_date', v_next_date,
    'days_until_due', extract(day from v_next_date - CURRENT_DATE),
    'pending_filings', v_pending_count,
    'auto_file', v_config.auto_file,
    'file_on_day', v_config.file_on_day
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process automated filings
CREATE OR REPLACE FUNCTION process_automated_filings()
RETURNS void AS $$
DECLARE
  v_config record;
  v_run record;
BEGIN
  -- Get configs with auto-filing enabled
  FOR v_config IN
    SELECT * FROM ird_filing_config
    WHERE auto_file = true
    AND last_filing_date IS NOT NULL
  LOOP
    -- Check if filing is due
    IF is_filing_due(v_config.tenant_id) THEN
      -- Get unsubmitted payroll runs
      FOR v_run IN
        SELECT pr.* 
        FROM payroll_runs pr
        LEFT JOIN ird_filings f ON f.payroll_run_id = pr.id
        WHERE pr.tenant_id = v_config.tenant_id
        AND pr.status = 'completed'
        AND f.id IS NULL
      LOOP
        -- Submit filing
        PERFORM submit_ird_filing(v_run.id, 'ir348');
      END LOOP;

      -- Update last filing date
      UPDATE ird_filing_config
      SET 
        last_filing_date = CURRENT_DATE,
        next_filing_date = calculate_next_filing_date(CURRENT_DATE, filing_frequency)
      WHERE tenant_id = v_config.tenant_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_ird_filing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_filing_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_automated_filings() TO authenticated;