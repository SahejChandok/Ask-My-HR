-- Create table for payroll rollback logs if not exists
CREATE TABLE IF NOT EXISTS payroll_rollback_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid REFERENCES payroll_runs(id) ON DELETE CASCADE,
  rolled_back_by uuid REFERENCES users(id),
  reason text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payroll_rollback_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "tenant_access_policy" ON payroll_rollback_logs;

-- Add policy for viewing rollback logs
CREATE POLICY "rollback_logs_tenant_access" ON payroll_rollback_logs
  FOR SELECT
  TO authenticated
  USING (
    payroll_run_id IN (
      SELECT id FROM payroll_runs 
      WHERE tenant_id = get_auth_tenant_id()
    )
  );

-- Create function to check if user can rollback payroll
CREATE OR REPLACE FUNCTION can_rollback_payroll(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND role IN ('platform_admin', 'tenant_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update rollback function with audit logging and security
CREATE OR REPLACE FUNCTION rollback_payroll_run(
  p_run_id uuid,
  p_user_id uuid,
  p_reason text
)
RETURNS void AS $$
DECLARE
  v_run record;
  v_can_rollback boolean;
BEGIN
  -- Check authorization
  SELECT can_rollback_payroll(p_user_id) INTO v_can_rollback;
  IF NOT v_can_rollback THEN
    RAISE EXCEPTION 'Unauthorized: Only tenant admins can rollback payroll runs';
  END IF;

  -- Get payroll run details
  SELECT * INTO v_run
  FROM payroll_runs
  WHERE id = p_run_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run not found';
  END IF;

  IF v_run.status != 'completed' THEN
    RAISE EXCEPTION 'Only completed payroll runs can be rolled back';
  END IF;

  -- Start transaction
  BEGIN
    -- 1. Mark payroll run as voided
    UPDATE payroll_runs
    SET 
      status = 'voided',
      updated_at = now()
    WHERE id = p_run_id;

    -- 2. Delete payslips
    DELETE FROM payslips
    WHERE payroll_run_id = p_run_id;

    -- 3. Reopen timesheets
    UPDATE timesheets
    SET 
      status = 'submitted',
      approved_at = NULL,
      approved_by = NULL,
      updated_at = now()
    WHERE 
      tenant_id = v_run.tenant_id
      AND period_start >= v_run.period_start
      AND period_end <= v_run.period_end;

    -- 4. Reset leave balances
    UPDATE leave_balances lb
    SET 
      taken_hours = taken_hours - COALESCE((
        SELECT SUM(
          EXTRACT(EPOCH FROM (te.end_time - te.start_time)) / 3600 -
          COALESCE(te.break_minutes, 0) / 60
        )
        FROM timesheet_entries te
        JOIN timesheets t ON te.timesheet_id = t.id
        WHERE t.employee_id = lb.employee_id
        AND t.period_start >= v_run.period_start
        AND t.period_end <= v_run.period_end
      ), 0),
      updated_at = now()
    WHERE 
      employee_id IN (
        SELECT employee_id 
        FROM timesheets
        WHERE period_start >= v_run.period_start
        AND period_end <= v_run.period_end
      )
      AND year_start <= v_run.period_start
      AND year_end >= v_run.period_end;

    -- 5. Create audit log
    INSERT INTO payroll_rollback_logs (
      payroll_run_id,
      rolled_back_by,
      reason,
      details
    ) VALUES (
      p_run_id,
      p_user_id,
      p_reason,
      jsonb_build_object(
        'period_start', v_run.period_start,
        'period_end', v_run.period_end,
        'original_status', v_run.status,
        'timestamp', now()
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to rollback payroll run: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON payroll_rollback_logs TO authenticated;
GRANT EXECUTE ON FUNCTION can_rollback_payroll(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_payroll_run(uuid, uuid, text) TO authenticated;