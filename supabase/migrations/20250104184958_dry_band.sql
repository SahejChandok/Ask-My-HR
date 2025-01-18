-- Add voided status to payroll_status enum
ALTER TYPE payroll_status ADD VALUE IF NOT EXISTS 'voided';

-- Create function to rollback a payroll run
CREATE OR REPLACE FUNCTION rollback_payroll_run(p_run_id uuid)
RETURNS void AS $$
DECLARE
  v_run record;
  v_timesheet record;
BEGIN
  -- Get payroll run details
  SELECT * INTO v_run
  FROM payroll_runs
  WHERE id = p_run_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run not found';
  END IF;

  IF v_run.status != 'completed' THEN
    RAISE EXCEPTION 'Invalid payroll run status';
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
    -- First get all leave requests in the period
    FOR v_timesheet IN (
      SELECT * FROM timesheets
      WHERE 
        tenant_id = v_run.tenant_id
        AND period_start >= v_run.period_start
        AND period_end <= v_run.period_end
    ) LOOP
      -- Reset leave balances for each affected employee
      UPDATE leave_balances
      SET 
        taken_hours = taken_hours - (
          SELECT COALESCE(SUM(
            EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 -
            COALESCE(break_minutes, 0) / 60
          ), 0)
          FROM timesheet_entries
          WHERE timesheet_id = v_timesheet.id
        ),
        updated_at = now()
      WHERE 
        employee_id = v_timesheet.employee_id
        AND year_start <= v_run.period_start
        AND year_end >= v_run.period_end;
    END LOOP;

    -- 5. Log the rollback
    INSERT INTO payroll_calculation_logs (
      payroll_run_id,
      employee_id,
      log_type,
      details
    )
    VALUES (
      p_run_id,
      NULL,
      'rollback',
      jsonb_build_object(
        'action', 'rollback',
        'timestamp', now(),
        'period_start', v_run.period_start,
        'period_end', v_run.period_end
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to rollback payroll run: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;