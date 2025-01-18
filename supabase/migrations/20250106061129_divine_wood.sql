-- Add indexes for IRD filing queries
CREATE INDEX IF NOT EXISTS idx_ird_filings_tenant_period 
ON ird_filings(tenant_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_ird_filings_status 
ON ird_filings(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_ird_filing_details_filing 
ON ird_filing_details(filing_id);

-- Create function to validate filing schedule
CREATE OR REPLACE FUNCTION validate_filing_schedule(
  p_tenant_id uuid,
  p_filing_frequency text,
  p_last_filing_date date
) RETURNS jsonb AS $$
DECLARE
  v_next_date date;
  v_pending_count integer;
BEGIN
  -- Calculate next filing date
  v_next_date := CASE p_filing_frequency
    WHEN 'monthly' THEN
      p_last_filing_date + interval '1 month'
    WHEN 'twice-monthly' THEN
      CASE 
        WHEN extract(day from p_last_filing_date) <= 15 THEN
          date_trunc('month', p_last_filing_date) + interval '15 days'
        ELSE
          date_trunc('month', p_last_filing_date) + interval '1 month'
      END
    ELSE -- payday
      p_last_filing_date + interval '14 days'
  END;

  -- Get count of pending filings
  SELECT COUNT(*) INTO v_pending_count
  FROM ird_filings
  WHERE tenant_id = p_tenant_id
  AND status = 'pending';

  RETURN jsonb_build_object(
    'next_filing_date', v_next_date,
    'pending_filings', v_pending_count,
    'days_until_due', 
    extract(day from v_next_date - CURRENT_DATE)::integer
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if filing is due
CREATE OR REPLACE FUNCTION is_filing_due(
  p_tenant_id uuid
) RETURNS boolean AS $$
DECLARE
  v_config record;
  v_next_date date;
BEGIN
  -- Get filing config
  SELECT * INTO v_config
  FROM ird_filing_config
  WHERE tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get next filing date
  SELECT (validate_filing_schedule(
    p_tenant_id,
    v_config.filing_frequency,
    v_config.last_filing_date
  )->>'next_filing_date')::date INTO v_next_date;

  -- Check if filing is due
  RETURN CURRENT_DATE >= v_next_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_filing_schedule(uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION is_filing_due(uuid) TO authenticated;