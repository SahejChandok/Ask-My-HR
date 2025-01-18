-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_date 
ON timesheet_entries(date);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_employee 
ON timesheet_entries(timesheet_id, date);

CREATE INDEX IF NOT EXISTS idx_timesheets_period 
ON timesheets(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period 
ON payroll_runs(tenant_id, period_start, period_end);

-- Create function for bulk timesheet loading
CREATE OR REPLACE FUNCTION bulk_load_timesheets(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date
) RETURNS TABLE (
  timesheet_id uuid,
  employee_id uuid,
  entry_date date,
  start_time time,
  end_time time,
  break_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.timesheet_id,
    t.employee_id,
    te.date,
    te.start_time,
    te.end_time,
    te.break_minutes
  FROM timesheet_entries te
  JOIN timesheets t ON te.timesheet_id = t.id
  WHERE t.tenant_id = p_tenant_id
  AND t.status = 'approved'
  AND te.date BETWEEN p_period_start AND p_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for bulk employee loading
CREATE OR REPLACE FUNCTION bulk_load_employees(
  p_tenant_id uuid,
  p_employee_ids uuid[]
) RETURNS TABLE (
  id uuid,
  employment_type text,
  hourly_rate numeric,
  kiwisaver_enrolled boolean,
  kiwisaver_rate numeric,
  tax_code text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employment_type,
    e.hourly_rate,
    e.kiwisaver_enrolled,
    e.kiwisaver_rate,
    e.tax_code
  FROM employee_profiles e
  WHERE e.tenant_id = p_tenant_id
  AND e.id = ANY(p_employee_ids)
  AND e.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for bulk payslip creation
CREATE OR REPLACE FUNCTION bulk_create_payslips(
  p_payroll_run_id uuid,
  p_payslips jsonb[]
) RETURNS void AS $$
BEGIN
  INSERT INTO payslips (
    payroll_run_id,
    employee_id,
    gross_pay,
    kiwisaver_deduction,
    employer_kiwisaver,
    paye_tax,
    net_pay
  )
  SELECT 
    p_payroll_run_id,
    (p->>'employee_id')::uuid,
    (p->>'gross_pay')::numeric,
    (p->>'kiwisaver_deduction')::numeric,
    (p->>'employer_kiwisaver')::numeric,
    (p->>'paye_tax')::numeric,
    (p->>'net_pay')::numeric
  FROM unnest(p_payslips) p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;