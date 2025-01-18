-- Add indexes for payroll calculation logs
CREATE INDEX IF NOT EXISTS idx_payroll_logs_run_type 
ON payroll_calculation_logs(payroll_run_id, log_type);

CREATE INDEX IF NOT EXISTS idx_payroll_logs_employee_type 
ON payroll_calculation_logs(employee_id, log_type);

-- Create function to bulk save calculation logs
CREATE OR REPLACE FUNCTION bulk_save_calculation_logs(
  p_payroll_run_id uuid,
  p_logs jsonb[]
) RETURNS void AS $$
BEGIN
  INSERT INTO payroll_calculation_logs (
    payroll_run_id,
    employee_id,
    log_type,
    details
  )
  SELECT 
    p_payroll_run_id,
    (p->>'employee_id')::uuid,
    (p->>'log_type')::text,
    (p->>'details')::jsonb
  FROM unnest(p_logs) p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get calculation logs for a payroll run
CREATE OR REPLACE FUNCTION get_payroll_calculation_logs(
  p_payroll_run_id uuid,
  p_employee_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  employee_id uuid,
  log_type text,
  details jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcl.id,
    pcl.employee_id,
    pcl.log_type,
    pcl.details,
    pcl.created_at
  FROM payroll_calculation_logs pcl
  WHERE pcl.payroll_run_id = p_payroll_run_id
  AND (p_employee_id IS NULL OR pcl.employee_id = p_employee_id)
  ORDER BY pcl.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get payroll run summary
CREATE OR REPLACE FUNCTION get_payroll_run_summary(
  p_run_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_run record;
  v_summary jsonb;
BEGIN
  -- Get payroll run details
  SELECT 
    pr.*,
    COUNT(DISTINCT p.employee_id) as employee_count,
    SUM(p.gross_pay) as total_gross,
    SUM(p.net_pay) as total_net,
    SUM(p.kiwisaver_deduction) as total_kiwisaver,
    SUM(p.paye_tax) as total_paye
  INTO v_run
  FROM payroll_runs pr
  LEFT JOIN payslips p ON p.payroll_run_id = pr.id
  WHERE pr.id = p_run_id
  GROUP BY pr.id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Build summary
  v_summary := jsonb_build_object(
    'id', v_run.id,
    'period_start', v_run.period_start,
    'period_end', v_run.period_end,
    'status', v_run.status,
    'employee_count', v_run.employee_count,
    'totals', jsonb_build_object(
      'gross', v_run.total_gross,
      'net', v_run.total_net,
      'kiwisaver', v_run.total_kiwisaver,
      'paye', v_run.total_paye
    ),
    'processed_by', v_run.processed_by,
    'processed_at', v_run.created_at
  );

  -- Add rollback info if voided
  IF v_run.status = 'voided' THEN
    v_summary := v_summary || jsonb_build_object(
      'rollback', (
        SELECT jsonb_build_object(
          'rolled_back_by', rolled_back_by,
          'reason', reason,
          'timestamp', created_at
        )
        FROM payroll_rollback_logs
        WHERE payroll_run_id = p_run_id
        ORDER BY created_at DESC
        LIMIT 1
      )
    );
  END IF;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION bulk_save_calculation_logs(uuid, jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payroll_calculation_logs(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payroll_run_summary(uuid) TO authenticated;