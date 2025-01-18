-- Create tables first
CREATE TABLE IF NOT EXISTS holiday_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  date date NOT NULL,
  description text NOT NULL,
  rate numeric(3,2) NOT NULL DEFAULT 1.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_holiday_date_tenant UNIQUE (date, tenant_id)
);

CREATE TABLE IF NOT EXISTS overtime_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  daily_hours numeric(4,2) NOT NULL DEFAULT 8.0,
  weekly_hours numeric(4,2) NOT NULL DEFAULT 40.0,
  overtime_rate numeric(3,2) NOT NULL DEFAULT 1.5,
  double_time_rate numeric(3,2) NOT NULL DEFAULT 2.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_tenant_rules UNIQUE (tenant_id)
);

-- Enable RLS
ALTER TABLE holiday_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_rules ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "holiday_rates_tenant_access" ON holiday_rates
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "overtime_rules_tenant_access" ON overtime_rules
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Add columns to timesheet_entries for rate tracking
ALTER TABLE timesheet_entries 
ADD COLUMN IF NOT EXISTS rate_multiplier numeric(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_holiday boolean DEFAULT false;

-- Create function to calculate overtime hours
CREATE OR REPLACE FUNCTION calculate_overtime_hours(
  p_tenant_id uuid,
  p_employee_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  date date,
  regular_hours numeric,
  overtime_hours numeric,
  double_time_hours numeric,
  holiday_hours numeric
) AS $$
DECLARE
  v_rules overtime_rules%ROWTYPE;
BEGIN
  -- Get overtime rules for tenant
  SELECT * INTO v_rules 
  FROM overtime_rules 
  WHERE tenant_id = p_tenant_id;

  -- Use default rules if none set
  IF NOT FOUND THEN
    v_rules.daily_hours := 8.0;
    v_rules.weekly_hours := 40.0;
    v_rules.overtime_rate := 1.5;
    v_rules.double_time_rate := 2.0;
  END IF;

  RETURN QUERY
  WITH daily_hours AS (
    -- Calculate hours per day
    SELECT 
      te.date,
      EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600 - 
      COALESCE(te.break_minutes, 0)/60.0 as total_hours,
      te.is_holiday
    FROM timesheet_entries te
    JOIN timesheets t ON te.timesheet_id = t.id
    WHERE t.employee_id = p_employee_id
    AND te.date BETWEEN p_start_date AND p_end_date
    AND t.status = 'approved'
  ),
  weekly_totals AS (
    -- Calculate weekly totals
    SELECT 
      date_trunc('week', date) as week_start,
      SUM(total_hours) as week_hours
    FROM daily_hours
    GROUP BY date_trunc('week', date)
  )
  SELECT 
    dh.date,
    -- Regular hours (up to daily limit)
    CASE 
      WHEN dh.is_holiday THEN 0
      ELSE LEAST(dh.total_hours, v_rules.daily_hours)
    END as regular_hours,
    -- Overtime hours (between daily limit and double time threshold)
    CASE 
      WHEN dh.is_holiday THEN 0
      WHEN dh.total_hours > v_rules.daily_hours THEN
        LEAST(dh.total_hours - v_rules.daily_hours, 4.0)
      ELSE 0
    END as overtime_hours,
    -- Double time hours (beyond overtime threshold)
    CASE 
      WHEN dh.is_holiday THEN 0
      WHEN dh.total_hours > (v_rules.daily_hours + 4.0) THEN
        dh.total_hours - (v_rules.daily_hours + 4.0)
      ELSE 0
    END as double_time_hours,
    -- Holiday hours
    CASE 
      WHEN dh.is_holiday THEN dh.total_hours
      ELSE 0
    END as holiday_hours
  FROM daily_hours dh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get holiday rate for a date
CREATE OR REPLACE FUNCTION get_holiday_rate(
  p_tenant_id uuid,
  p_date date
) RETURNS numeric AS $$
DECLARE
  v_rate numeric;
BEGIN
  SELECT rate INTO v_rate
  FROM holiday_rates
  WHERE tenant_id = p_tenant_id
  AND date = p_date;
  
  RETURN COALESCE(v_rate, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add default overtime rules for existing tenants
INSERT INTO overtime_rules (tenant_id, daily_hours, weekly_hours)
SELECT 
  id as tenant_id,
  8.0 as daily_hours,
  40.0 as weekly_hours
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Add some common NZ public holidays for 2024
INSERT INTO holiday_rates (tenant_id, date, description, rate)
SELECT 
  t.id as tenant_id,
  d.date,
  d.description,
  1.5 as rate
FROM tenants t
CROSS JOIN (VALUES
  ('2024-01-01'::date, 'New Year''s Day'),
  ('2024-01-02'::date, 'Day after New Year''s Day'),
  ('2024-02-06'::date, 'Waitangi Day'),
  ('2024-03-29'::date, 'Good Friday'),
  ('2024-04-01'::date, 'Easter Monday'),
  ('2024-04-25'::date, 'ANZAC Day'),
  ('2024-06-03'::date, 'King''s Birthday'),
  ('2024-10-28'::date, 'Labour Day'),
  ('2024-12-25'::date, 'Christmas Day'),
  ('2024-12-26'::date, 'Boxing Day')
) as d(date, description)
ON CONFLICT (date, tenant_id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON holiday_rates TO authenticated;
GRANT ALL ON overtime_rules TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_overtime_hours(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_holiday_rate(uuid, date) TO authenticated;