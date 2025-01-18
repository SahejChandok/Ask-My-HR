-- Create admin metrics table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS admin_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id),
    active_employees integer DEFAULT 0,
    pending_timesheets integer DEFAULT 0,
    pending_leave integer DEFAULT 0,
    monthly_payroll numeric(12,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_tenant_metrics UNIQUE (tenant_id)
  );
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "tenant_access_policy" ON admin_metrics;

-- Add RLS policy
CREATE POLICY "tenant_access_policy" ON admin_metrics
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Create or replace function to update metrics
CREATE OR REPLACE FUNCTION update_admin_metrics(p_tenant_id uuid)
RETURNS void AS $$
DECLARE
  v_active_employees integer;
  v_pending_timesheets integer;
  v_pending_leave integer;
  v_monthly_payroll numeric;
BEGIN
  -- Get active employees count
  SELECT COUNT(*) INTO v_active_employees
  FROM employee_profiles
  WHERE tenant_id = p_tenant_id
  AND is_active = true;

  -- Get pending timesheets count
  SELECT COUNT(*) INTO v_pending_timesheets
  FROM timesheets
  WHERE tenant_id = p_tenant_id
  AND status = 'submitted';

  -- Get pending leave requests count
  SELECT COUNT(*) INTO v_pending_leave
  FROM leave_requests
  WHERE tenant_id = p_tenant_id
  AND status = 'pending';

  -- Get monthly payroll total
  SELECT COALESCE(SUM(gross_pay), 0) INTO v_monthly_payroll
  FROM payslips ps
  JOIN payroll_runs pr ON ps.payroll_run_id = pr.id
  WHERE pr.tenant_id = p_tenant_id
  AND pr.status = 'completed'
  AND pr.period_start >= date_trunc('month', CURRENT_DATE);

  -- Update metrics
  INSERT INTO admin_metrics (
    tenant_id,
    active_employees,
    pending_timesheets,
    pending_leave,
    monthly_payroll,
    updated_at
  ) VALUES (
    p_tenant_id,
    v_active_employees,
    v_pending_timesheets,
    v_pending_leave,
    v_monthly_payroll,
    now()
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    active_employees = EXCLUDED.active_employees,
    pending_timesheets = EXCLUDED.pending_timesheets,
    pending_leave = EXCLUDED.pending_leave,
    monthly_payroll = EXCLUDED.monthly_payroll,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_metrics_on_employee_change ON employee_profiles;
DROP TRIGGER IF EXISTS update_metrics_on_timesheet_change ON timesheets;
DROP TRIGGER IF EXISTS update_metrics_on_leave_change ON leave_requests;
DROP TRIGGER IF EXISTS update_metrics_on_payslip_change ON payslips;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION trigger_update_admin_metrics()
RETURNS trigger AS $$
BEGIN
  PERFORM update_admin_metrics(NEW.tenant_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for relevant tables
CREATE TRIGGER update_metrics_on_employee_change
  AFTER INSERT OR UPDATE OR DELETE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_admin_metrics();

CREATE TRIGGER update_metrics_on_timesheet_change
  AFTER INSERT OR UPDATE OR DELETE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_admin_metrics();

CREATE TRIGGER update_metrics_on_leave_change
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_admin_metrics();

CREATE TRIGGER update_metrics_on_payslip_change
  AFTER INSERT OR UPDATE OR DELETE ON payslips
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_admin_metrics();

-- Initialize metrics for existing tenants
INSERT INTO admin_metrics (tenant_id)
SELECT id FROM tenants
ON CONFLICT DO NOTHING;

-- Update metrics for all tenants
DO $$
DECLARE
  t_id uuid;
BEGIN
  FOR t_id IN SELECT id FROM tenants LOOP
    PERFORM update_admin_metrics(t_id);
  END LOOP;
END $$;