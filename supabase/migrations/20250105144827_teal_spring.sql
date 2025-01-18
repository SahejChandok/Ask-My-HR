-- Create ACC levy tracking table if not exists
CREATE TABLE IF NOT EXISTS acc_levy_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id),
  tenant_id uuid REFERENCES tenants(id),
  tax_year varchar(9) NOT NULL,
  ytd_earnings numeric(12,2) DEFAULT 0,
  ytd_levy numeric(10,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  CONSTRAINT unique_employee_year UNIQUE (employee_id, tax_year)
);

-- Enable RLS
ALTER TABLE acc_levy_tracking ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "tenant_access_policy" ON acc_levy_tracking
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Initialize ACC tracking for existing employees
INSERT INTO acc_levy_tracking (
  employee_id,
  tenant_id,
  tax_year,
  ytd_earnings,
  ytd_levy
)
SELECT 
  id as employee_id,
  tenant_id,
  '2024-2025' as tax_year,
  0 as ytd_earnings,
  0 as ytd_levy
FROM employee_profiles
ON CONFLICT (employee_id, tax_year) DO NOTHING;

-- Create function to get ACC YTD earnings
CREATE OR REPLACE FUNCTION get_acc_ytd_earnings(
  p_employee_id uuid,
  p_tax_year varchar DEFAULT '2024-2025'
) RETURNS numeric AS $$
DECLARE
  v_ytd_earnings numeric;
BEGIN
  SELECT ytd_earnings INTO v_ytd_earnings
  FROM acc_levy_tracking
  WHERE employee_id = p_employee_id
  AND tax_year = p_tax_year;

  RETURN COALESCE(v_ytd_earnings, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update ACC tracking
CREATE OR REPLACE FUNCTION update_acc_tracking(
  p_employee_id uuid,
  p_tenant_id uuid,
  p_earnings numeric,
  p_levy numeric,
  p_tax_year varchar DEFAULT '2024-2025'
) RETURNS void AS $$
BEGIN
  INSERT INTO acc_levy_tracking (
    employee_id,
    tenant_id,
    tax_year,
    ytd_earnings,
    ytd_levy,
    last_updated
  ) VALUES (
    p_employee_id,
    p_tenant_id,
    p_tax_year,
    p_earnings,
    p_levy,
    now()
  )
  ON CONFLICT (employee_id, tax_year) DO UPDATE SET
    ytd_earnings = acc_levy_tracking.ytd_earnings + p_earnings,
    ytd_levy = acc_levy_tracking.ytd_levy + p_levy,
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON acc_levy_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION get_acc_ytd_earnings(uuid, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION update_acc_tracking(uuid, uuid, numeric, numeric, varchar) TO authenticated;