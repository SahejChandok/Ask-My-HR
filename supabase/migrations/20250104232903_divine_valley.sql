-- Drop existing functions first
DROP FUNCTION IF EXISTS process_payroll(uuid, uuid, date, date);
DROP FUNCTION IF EXISTS validate_payroll_period(uuid, date, date);

-- Create function to validate payroll period
CREATE OR REPLACE FUNCTION validate_payroll_period(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date
) RETURNS jsonb AS $$
DECLARE
  v_overlapping_runs jsonb;
  v_pending_timesheets integer;
BEGIN
  -- Validate date order
  IF p_period_end < p_period_start THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'End date must be after start date'
    );
  END IF;

  -- Check for overlapping payroll runs
  WITH overlapping AS (
    SELECT 
      id,
      period_start,
      period_end,
      status
    FROM payroll_runs
    WHERE tenant_id = p_tenant_id
    AND status NOT IN ('cancelled', 'voided')
    AND period_start <= p_period_end
    AND period_end >= p_period_start
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'period_start', period_start,
      'period_end', period_end,
      'status', status
    )
  ) INTO v_overlapping_runs
  FROM overlapping;

  IF v_overlapping_runs IS NOT NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'A payroll run already exists for this period',
      'overlapping_runs', v_overlapping_runs
    );
  END IF;

  -- Check for unapproved timesheets
  SELECT COUNT(*)
  INTO v_pending_timesheets
  FROM timesheets
  WHERE tenant_id = p_tenant_id
  AND period_start <= p_period_end
  AND period_end >= p_period_start
  AND status != 'approved';

  IF v_pending_timesheets > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', format('%s timesheet(s) require approval before running payroll', v_pending_timesheets),
      'pending_timesheets', v_pending_timesheets
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process payroll
CREATE OR REPLACE FUNCTION process_payroll(
  p_tenant_id uuid,
  p_user_id uuid,
  p_period_start date,
  p_period_end date
) RETURNS TABLE (
  employee jsonb,
  calculations jsonb
) AS $$
DECLARE
  v_validation jsonb;
  v_payroll_run_id uuid;
  v_employee record;
  v_entries record;
  v_gross_pay numeric;
  v_kiwisaver_deduction numeric;
  v_employer_kiwisaver numeric;
  v_paye_tax numeric;
  v_net_pay numeric;
  v_annual_salary numeric;
  v_tax_rate numeric;
BEGIN
  -- Validate period
  v_validation := validate_payroll_period(p_tenant_id, p_period_start, p_period_end);
  IF NOT (v_validation->>'valid')::boolean THEN
    RAISE EXCEPTION '%', v_validation->>'message';
  END IF;

  -- Create payroll run
  INSERT INTO payroll_runs (
    tenant_id,
    period_start,
    period_end,
    processed_by,
    status
  ) VALUES (
    p_tenant_id,
    p_period_start,
    p_period_end,
    p_user_id,
    'processing'
  ) RETURNING id INTO v_payroll_run_id;

  -- Process each employee
  FOR v_employee IN (
    SELECT *
    FROM employee_profiles
    WHERE tenant_id = p_tenant_id
    AND is_active = true
  ) LOOP
    -- Get timesheet entries
    SELECT 
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 -
        (break_minutes::numeric / 60)
      ), 0) as total_hours,
      COUNT(*) as entry_count
    INTO v_entries
    FROM timesheet_entries te
    JOIN timesheets t ON te.timesheet_id = t.id
    WHERE t.employee_id = v_employee.id
    AND t.status = 'approved'
    AND te.date BETWEEN p_period_start AND p_period_end;

    -- Calculate pay
    IF v_employee.employment_type = 'salary' THEN
      v_annual_salary := v_employee.hourly_rate * 2080;
      v_gross_pay := v_annual_salary / 26;
    ELSE
      v_gross_pay := v_entries.total_hours * v_employee.hourly_rate;
    END IF;

    -- Calculate KiwiSaver
    IF v_employee.kiwisaver_enrolled THEN
      v_kiwisaver_deduction := v_gross_pay * (v_employee.kiwisaver_rate / 100);
      v_employer_kiwisaver := v_gross_pay * 0.03;
    ELSE
      v_kiwisaver_deduction := 0;
      v_employer_kiwisaver := 0;
    END IF;

    -- Calculate PAYE tax
    v_annual_salary := v_gross_pay * 26;
    v_tax_rate := CASE
      WHEN v_annual_salary <= 14000 THEN 0.105
      WHEN v_annual_salary <= 48000 THEN 0.175
      WHEN v_annual_salary <= 70000 THEN 0.30
      WHEN v_annual_salary <= 180000 THEN 0.33
      ELSE 0.39
    END;
    
    IF v_employee.tax_code = 'SB' THEN
      v_tax_rate := 0.30;
    END IF;
    
    v_paye_tax := v_gross_pay * v_tax_rate;
    v_net_pay := v_gross_pay - v_kiwisaver_deduction - v_paye_tax;

    -- Create payslip
    INSERT INTO payslips (
      payroll_run_id,
      employee_id,
      gross_pay,
      kiwisaver_deduction,
      employer_kiwisaver,
      paye_tax,
      net_pay
    ) VALUES (
      v_payroll_run_id,
      v_employee.id,
      v_gross_pay,
      v_kiwisaver_deduction,
      v_employer_kiwisaver,
      v_paye_tax,
      v_net_pay
    );

    -- Return result row
    employee := jsonb_build_object(
      'id', v_employee.id,
      'first_name', v_employee.first_name,
      'last_name', v_employee.last_name,
      'email', v_employee.email,
      'employment_type', v_employee.employment_type,
      'kiwisaver_rate', v_employee.kiwisaver_rate,
      'kiwisaver_enrolled', v_employee.kiwisaver_enrolled,
      'tax_code', v_employee.tax_code
    );
    
    calculations := jsonb_build_object(
      'grossPay', round(v_gross_pay::numeric, 2),
      'kiwiSaverDeduction', round(v_kiwisaver_deduction::numeric, 2),
      'employerKiwiSaver', round(v_employer_kiwisaver::numeric, 2),
      'payeTax', round(v_paye_tax::numeric, 2),
      'netPay', round(v_net_pay::numeric, 2)
    );

    RETURN NEXT;
  END LOOP;

  -- Update payroll run status
  UPDATE payroll_runs
  SET status = 'completed'
  WHERE id = v_payroll_run_id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_payroll_period(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payroll(uuid, uuid, date, date) TO authenticated;