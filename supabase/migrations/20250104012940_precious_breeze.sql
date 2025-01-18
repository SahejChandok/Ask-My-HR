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
  v_employee record;
  v_entries record;
  v_gross_pay numeric;
  v_kiwisaver_deduction numeric;
  v_employer_kiwisaver numeric;
  v_paye_tax numeric;
  v_net_pay numeric;
BEGIN
  -- Validate period
  IF p_period_end < p_period_start THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;

  -- Check for existing payroll run
  IF EXISTS (
    SELECT 1 FROM payroll_runs
    WHERE tenant_id = p_tenant_id
    AND period_start <= p_period_end
    AND period_end >= p_period_start
    AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'A payroll run already exists for this period';
  END IF;

  -- Create payroll run record
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
    'completed'
  );

  -- Process each employee
  FOR v_employee IN
    SELECT *
    FROM employee_profiles
    WHERE tenant_id = p_tenant_id
    AND is_active = true
  LOOP
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
      -- Convert annual salary to period pay
      v_gross_pay := (v_employee.hourly_rate * 2080) / 26; -- Fortnightly rate
    ELSE
      -- Calculate hourly pay
      v_gross_pay := v_entries.total_hours * v_employee.hourly_rate;
    END IF;

    -- Calculate KiwiSaver
    IF v_employee.kiwisaver_enrolled THEN
      v_kiwisaver_deduction := v_gross_pay * (v_employee.kiwisaver_rate / 100);
      v_employer_kiwisaver := v_gross_pay * 0.03; -- 3% employer contribution
    ELSE
      v_kiwisaver_deduction := 0;
      v_employer_kiwisaver := 0;
    END IF;

    -- Calculate PAYE tax (simplified)
    v_paye_tax := CASE
      WHEN v_gross_pay * 26 <= 14000 THEN v_gross_pay * 0.105
      WHEN v_gross_pay * 26 <= 48000 THEN v_gross_pay * 0.175
      WHEN v_gross_pay * 26 <= 70000 THEN v_gross_pay * 0.30
      WHEN v_gross_pay * 26 <= 180000 THEN v_gross_pay * 0.33
      ELSE v_gross_pay * 0.39
    END;

    -- Calculate net pay
    v_net_pay := v_gross_pay - v_kiwisaver_deduction - v_paye_tax;

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

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_payroll(uuid, uuid, date, date) TO authenticated;