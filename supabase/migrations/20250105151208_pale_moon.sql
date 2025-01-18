-- Update process_payroll function to fix date calculations
CREATE OR REPLACE FUNCTION process_payroll(
  p_tenant_id uuid,
  p_user_id uuid,
  p_period_start date,
  p_period_end date,
  p_acc_earnings jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  employee jsonb,
  calculations jsonb
) AS $$
DECLARE
  v_employee record;
  v_entries record;
  v_leave_requests record;
  v_gross_pay numeric;
  v_kiwisaver_deduction numeric;
  v_employer_kiwisaver numeric;
  v_paye_tax numeric;
  v_acc_levy numeric;
  v_net_pay numeric;
  v_ytd_earnings numeric;
  v_leave_days integer;
BEGIN
  -- Validate period
  IF p_period_end < p_period_start THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;

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

    -- Get leave requests and calculate days
    SELECT 
      COALESCE(SUM(
        EXTRACT(DAY FROM (end_date - start_date + interval '1 day'))::integer
      ), 0) as leave_days,
      array_agg(leave_type) as leave_types,
      array_agg(start_date) as leave_dates
    INTO v_leave_requests
    FROM leave_requests
    WHERE employee_id = v_employee.id
    AND status = 'approved'
    AND start_date <= p_period_end
    AND end_date >= p_period_start;

    -- Calculate leave hours (8 hours per day)
    v_leave_days := COALESCE(v_leave_requests.leave_days, 0);

    -- Calculate gross pay
    IF v_employee.employment_type = 'salary' THEN
      v_gross_pay := (v_employee.hourly_rate * 2080) / 26; -- Fortnightly rate
    ELSE
      v_gross_pay := v_entries.total_hours * v_employee.hourly_rate;
    END IF;

    -- Add leave pay
    IF v_leave_days > 0 THEN
      v_gross_pay := v_gross_pay + (v_leave_days * 8 * v_employee.hourly_rate);
    END IF;

    -- Calculate ACC levy
    v_ytd_earnings := COALESCE((p_acc_earnings->>(v_employee.id::text))::numeric, 0);
    SELECT levy INTO v_acc_levy
    FROM calculate_acc_levy(v_gross_pay, v_ytd_earnings);

    -- Calculate KiwiSaver
    IF v_employee.kiwisaver_enrolled THEN
      v_kiwisaver_deduction := v_gross_pay * (v_employee.kiwisaver_rate / 100);
      v_employer_kiwisaver := v_gross_pay * 0.03; -- 3% employer contribution
    ELSE
      v_kiwisaver_deduction := 0;
      v_employer_kiwisaver := 0;
    END IF;

    -- Calculate PAYE tax
    v_paye_tax := calculate_paye_tax(v_gross_pay, v_employee.tax_code);

    -- Calculate net pay
    v_net_pay := v_gross_pay - v_paye_tax - v_kiwisaver_deduction - v_acc_levy;

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
      'accLevy', round(v_acc_levy::numeric, 2),
      'accLevyDetails', jsonb_build_object(
        'ytdEarnings', v_ytd_earnings,
        'remainingCap', 139384 - v_ytd_earnings
      ),
      'netPay', round(v_net_pay::numeric, 2),
      'leaveDetails', CASE WHEN v_leave_days > 0 THEN
        jsonb_build_object(
          'hours', v_leave_days * 8,
          'amount', round((v_leave_days * 8 * v_employee.hourly_rate)::numeric, 2),
          'type', v_leave_requests.leave_types[1],
          'dates', v_leave_requests.leave_dates
        )
      ELSE NULL END
    );

    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;