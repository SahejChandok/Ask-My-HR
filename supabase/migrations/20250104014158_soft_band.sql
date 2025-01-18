-- Create table for payroll calculation logs
CREATE TABLE payroll_calculation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid REFERENCES payroll_runs(id),
  employee_id uuid REFERENCES employee_profiles(id),
  log_type text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on logs table
ALTER TABLE payroll_calculation_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for logs
CREATE POLICY "Users can view logs for their tenant"
  ON payroll_calculation_logs
  FOR SELECT
  TO authenticated
  USING (
    payroll_run_id IN (
      SELECT id FROM payroll_runs 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );

-- Update payroll processing function with detailed logging
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
  v_payroll_run_id uuid;
  v_annual_salary numeric;
  v_tax_rate numeric;
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
  ) RETURNING id INTO v_payroll_run_id;

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

    -- Log timesheet details
    INSERT INTO payroll_calculation_logs (
      payroll_run_id, employee_id, log_type, details
    ) VALUES (
      v_payroll_run_id,
      v_employee.id,
      'timesheet_summary',
      jsonb_build_object(
        'total_hours', v_entries.total_hours,
        'entry_count', v_entries.entry_count
      )
    );

    -- Calculate pay
    IF v_employee.employment_type = 'salary' THEN
      -- Convert annual salary to period pay
      v_annual_salary := v_employee.hourly_rate * 2080; -- Annual salary
      v_gross_pay := v_annual_salary / 26; -- Fortnightly rate
      
      -- Log salary calculation
      INSERT INTO payroll_calculation_logs (
        payroll_run_id, employee_id, log_type, details
      ) VALUES (
        v_payroll_run_id,
        v_employee.id,
        'salary_calculation',
        jsonb_build_object(
          'annual_salary', v_annual_salary,
          'pay_period_amount', v_gross_pay,
          'calculation_method', 'annual_to_fortnightly'
        )
      );
    ELSE
      -- Calculate hourly pay
      v_gross_pay := v_entries.total_hours * v_employee.hourly_rate;
      
      -- Log hourly calculation
      INSERT INTO payroll_calculation_logs (
        payroll_run_id, employee_id, log_type, details
      ) VALUES (
        v_payroll_run_id,
        v_employee.id,
        'hourly_calculation',
        jsonb_build_object(
          'hours_worked', v_entries.total_hours,
          'hourly_rate', v_employee.hourly_rate,
          'gross_pay', v_gross_pay
        )
      );
    END IF;

    -- Calculate KiwiSaver
    IF v_employee.kiwisaver_enrolled THEN
      v_kiwisaver_deduction := v_gross_pay * (v_employee.kiwisaver_rate / 100);
      v_employer_kiwisaver := v_gross_pay * 0.03; -- 3% employer contribution
      
      -- Log KiwiSaver calculation
      INSERT INTO payroll_calculation_logs (
        payroll_run_id, employee_id, log_type, details
      ) VALUES (
        v_payroll_run_id,
        v_employee.id,
        'kiwisaver_calculation',
        jsonb_build_object(
          'gross_pay', v_gross_pay,
          'employee_rate', v_employee.kiwisaver_rate,
          'employee_contribution', v_kiwisaver_deduction,
          'employer_contribution', v_employer_kiwisaver
        )
      );
    ELSE
      v_kiwisaver_deduction := 0;
      v_employer_kiwisaver := 0;
    END IF;

    -- Calculate PAYE tax
    v_annual_salary := v_gross_pay * 26; -- Annualize pay for tax calculation
    v_tax_rate := CASE
      WHEN v_annual_salary <= 14000 THEN 0.105
      WHEN v_annual_salary <= 48000 THEN 0.175
      WHEN v_annual_salary <= 70000 THEN 0.30
      WHEN v_annual_salary <= 180000 THEN 0.33
      ELSE 0.39
    END;
    
    -- Apply secondary tax rate if applicable
    IF v_employee.tax_code = 'SB' THEN
      v_tax_rate := 0.30; -- Secondary tax rate
    END IF;
    
    v_paye_tax := v_gross_pay * v_tax_rate;

    -- Log tax calculation
    INSERT INTO payroll_calculation_logs (
      payroll_run_id, employee_id, log_type, details
    ) VALUES (
      v_payroll_run_id,
      v_employee.id,
      'tax_calculation',
      jsonb_build_object(
        'gross_pay', v_gross_pay,
        'annualized_pay', v_annual_salary,
        'tax_code', v_employee.tax_code,
        'tax_rate', v_tax_rate,
        'tax_amount', v_paye_tax
      )
    );

    -- Calculate net pay
    v_net_pay := v_gross_pay - v_kiwisaver_deduction - v_paye_tax;

    -- Log final calculation
    INSERT INTO payroll_calculation_logs (
      payroll_run_id, employee_id, log_type, details
    ) VALUES (
      v_payroll_run_id,
      v_employee.id,
      'final_calculation',
      jsonb_build_object(
        'gross_pay', v_gross_pay,
        'kiwisaver_deduction', v_kiwisaver_deduction,
        'paye_tax', v_paye_tax,
        'net_pay', v_net_pay
      )
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

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON payroll_calculation_logs TO authenticated;
GRANT EXECUTE ON FUNCTION process_payroll(uuid, uuid, date, date) TO authenticated;