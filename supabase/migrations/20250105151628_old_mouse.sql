-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS calculate_paye_tax(numeric, text);
DROP FUNCTION IF EXISTS calculate_acc_levy(numeric, numeric);
DROP FUNCTION IF EXISTS calculate_deductions(numeric, text, numeric, boolean);
DROP FUNCTION IF EXISTS process_payroll(uuid, uuid, date, date, jsonb);

-- Create helper function for PAYE tax calculation
CREATE OR REPLACE FUNCTION calculate_paye_tax(
  p_gross_pay numeric,
  p_tax_code tax_code
) RETURNS numeric AS $$
DECLARE
  v_annual_pay numeric;
  v_tax_rate numeric;
BEGIN
  -- Annualize pay for tax calculation
  v_annual_pay := p_gross_pay * 26; -- Based on fortnightly pay periods
  
  -- Calculate tax rate based on annual pay
  v_tax_rate := CASE
    WHEN v_annual_pay <= 14000 THEN 0.105
    WHEN v_annual_pay <= 48000 THEN 0.175
    WHEN v_annual_pay <= 70000 THEN 0.30
    WHEN v_annual_pay <= 180000 THEN 0.33
    ELSE 0.39
  END;

  -- Apply secondary tax rate if applicable
  IF p_tax_code = 'SB' THEN
    v_tax_rate := 0.30;
  END IF;

  RETURN round((p_gross_pay * v_tax_rate)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function for ACC levy calculation
CREATE OR REPLACE FUNCTION calculate_acc_levy(
  p_gross_pay numeric,
  p_ytd_earnings numeric DEFAULT 0
) RETURNS TABLE (
  levy numeric,
  new_ytd_earnings numeric,
  remaining_cap numeric
) AS $$
DECLARE
  v_levy_rate numeric := 0.0139; -- 1.39% for 2024
  v_earnings_cap numeric := 139384; -- Maximum earnings threshold for 2024
BEGIN
  -- Calculate remaining room under cap
  remaining_cap := greatest(0, v_earnings_cap - p_ytd_earnings);
  
  -- Calculate levy on capped earnings
  levy := round((least(p_gross_pay, remaining_cap) * v_levy_rate)::numeric, 2);
  
  -- Update YTD earnings
  new_ytd_earnings := least(p_ytd_earnings + p_gross_pay, v_earnings_cap);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function for deductions calculation
CREATE OR REPLACE FUNCTION calculate_deductions(
  p_gross_pay numeric,
  p_tax_code tax_code,
  p_kiwisaver_rate numeric,
  p_kiwisaver_enrolled boolean
) RETURNS TABLE (
  paye_tax numeric,
  kiwisaver_deduction numeric,
  employer_kiwisaver numeric
) AS $$
BEGIN
  -- Calculate PAYE tax
  paye_tax := calculate_paye_tax(p_gross_pay, p_tax_code);

  -- Calculate KiwiSaver
  IF p_kiwisaver_enrolled THEN
    kiwisaver_deduction := round((p_gross_pay * (p_kiwisaver_rate / 100))::numeric, 2);
    employer_kiwisaver := round((p_gross_pay * 0.03)::numeric, 2); -- 3% employer contribution
  ELSE
    kiwisaver_deduction := 0;
    employer_kiwisaver := 0;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create main payroll processing function
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
  v_acc_calc record;
  v_deductions record;
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
      COALESCE(COUNT(*), 0) as leave_days,
      array_agg(leave_type) as leave_types,
      array_agg(start_date) as leave_dates
    INTO v_leave_requests
    FROM (
      SELECT 
        leave_type,
        start_date,
        generate_series(
          greatest(start_date, p_period_start),
          least(end_date, p_period_end),
          '1 day'::interval
        )::date as date
      FROM leave_requests
      WHERE employee_id = v_employee.id
      AND status = 'approved'
      AND start_date <= p_period_end
      AND end_date >= p_period_start
    ) dates
    WHERE EXTRACT(DOW FROM date) NOT IN (0, 6); -- Exclude weekends

    -- Calculate gross pay
    IF v_employee.employment_type = 'salary' THEN
      v_gross_pay := (v_employee.hourly_rate * 2080) / 26; -- Fortnightly rate
    ELSE
      v_gross_pay := v_entries.total_hours * v_employee.hourly_rate;
    END IF;

    -- Add leave pay
    IF v_leave_requests.leave_days > 0 THEN
      v_gross_pay := v_gross_pay + (v_leave_requests.leave_days * 8 * v_employee.hourly_rate);
    END IF;

    -- Calculate ACC levy
    v_ytd_earnings := COALESCE((p_acc_earnings->>(v_employee.id::text))::numeric, 0);
    SELECT * INTO v_acc_calc FROM calculate_acc_levy(v_gross_pay, v_ytd_earnings);
    v_acc_levy := v_acc_calc.levy;

    -- Calculate other deductions
    SELECT * INTO v_deductions FROM calculate_deductions(
      v_gross_pay,
      v_employee.tax_code::tax_code,
      v_employee.kiwisaver_rate,
      v_employee.kiwisaver_enrolled
    );
    v_paye_tax := v_deductions.paye_tax;
    v_kiwisaver_deduction := v_deductions.kiwisaver_deduction;
    v_employer_kiwisaver := v_deductions.employer_kiwisaver;

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
        'ytdEarnings', v_acc_calc.new_ytd_earnings,
        'remainingCap', v_acc_calc.remaining_cap
      ),
      'netPay', round(v_net_pay::numeric, 2),
      'leaveDetails', CASE WHEN v_leave_requests.leave_days > 0 THEN
        jsonb_build_object(
          'hours', v_leave_requests.leave_days * 8,
          'amount', round((v_leave_requests.leave_days * 8 * v_employee.hourly_rate)::numeric, 2),
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_paye_tax(numeric, tax_code) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_acc_levy(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_deductions(numeric, tax_code, numeric, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payroll(uuid, uuid, date, date, jsonb) TO authenticated;