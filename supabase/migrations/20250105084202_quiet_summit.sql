/*
  # Add ACC Levy Configuration

  1. New Tables
    - `acc_levy_rates`
      - Stores ACC levy rates and thresholds by year
    - `acc_levy_tracking`
      - Tracks YTD earnings for ACC levy calculations

  2. Changes
    - Add ACC levy fields to payslips table
    - Add ACC levy calculation functions

  3. Security
    - Enable RLS on new tables
    - Add policies for tenant access
*/

-- Create ACC levy rates table
CREATE TABLE acc_levy_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  tax_year varchar(9) NOT NULL,
  earners_levy_rate numeric(6,4) NOT NULL,
  earnings_threshold numeric(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_tenant_year UNIQUE (tenant_id, tax_year)
);

-- Create ACC levy tracking table
CREATE TABLE acc_levy_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employee_profiles(id),
  tenant_id uuid REFERENCES tenants(id),
  tax_year varchar(9) NOT NULL,
  ytd_earnings numeric(12,2) DEFAULT 0,
  ytd_levy numeric(10,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  CONSTRAINT unique_employee_year UNIQUE (employee_id, tax_year)
);

-- Add ACC levy fields to payslips
ALTER TABLE payslips
ADD COLUMN acc_levy numeric(10,2) DEFAULT 0,
ADD COLUMN acc_ytd_earnings numeric(12,2),
ADD COLUMN acc_remaining_cap numeric(12,2);

-- Enable RLS
ALTER TABLE acc_levy_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE acc_levy_tracking ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "tenant_access" ON acc_levy_rates
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_access" ON acc_levy_tracking
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Insert default ACC levy rates for 2024-2025
INSERT INTO acc_levy_rates (
  tenant_id,
  tax_year,
  earners_levy_rate,
  earnings_threshold,
  start_date,
  end_date
)
SELECT 
  id as tenant_id,
  '2024-2025',
  0.0139,
  139384.00,
  '2024-04-01',
  '2025-03-31'
FROM tenants;

-- Create function to calculate ACC levy
CREATE OR REPLACE FUNCTION calculate_acc_levy(
  p_gross_pay numeric,
  p_employee_id uuid,
  p_tax_year varchar(9)
) RETURNS jsonb AS $$
DECLARE
  v_tenant_id uuid;
  v_levy_rate numeric;
  v_threshold numeric;
  v_ytd_earnings numeric;
  v_levy numeric;
  v_remaining_cap numeric;
BEGIN
  -- Get tenant ID and levy rate
  SELECT tenant_id, earners_levy_rate, earnings_threshold
  INTO v_tenant_id, v_levy_rate, v_threshold
  FROM acc_levy_rates ar
  JOIN employee_profiles ep ON ar.tenant_id = ep.tenant_id
  WHERE ep.id = p_employee_id
  AND ar.tax_year = p_tax_year;

  -- Get YTD earnings
  SELECT COALESCE(ytd_earnings, 0)
  INTO v_ytd_earnings
  FROM acc_levy_tracking
  WHERE employee_id = p_employee_id
  AND tax_year = p_tax_year;

  -- Calculate remaining cap
  v_remaining_cap := GREATEST(0, v_threshold - v_ytd_earnings);

  -- Calculate levy on capped earnings
  v_levy := LEAST(p_gross_pay, v_remaining_cap) * v_levy_rate;

  -- Update YTD tracking
  INSERT INTO acc_levy_tracking (
    employee_id,
    tenant_id,
    tax_year,
    ytd_earnings,
    ytd_levy
  ) VALUES (
    p_employee_id,
    v_tenant_id,
    p_tax_year,
    COALESCE(v_ytd_earnings, 0) + p_gross_pay,
    COALESCE((SELECT ytd_levy FROM acc_levy_tracking 
      WHERE employee_id = p_employee_id 
      AND tax_year = p_tax_year), 0) + v_levy
  )
  ON CONFLICT (employee_id, tax_year) 
  DO UPDATE SET
    ytd_earnings = EXCLUDED.ytd_earnings,
    ytd_levy = EXCLUDED.ytd_levy,
    last_updated = now();

  -- Return calculation details
  RETURN jsonb_build_object(
    'levy', v_levy,
    'ytd_earnings', v_ytd_earnings + p_gross_pay,
    'remaining_cap', v_remaining_cap,
    'levy_rate', v_levy_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON acc_levy_rates TO authenticated;
GRANT ALL ON acc_levy_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_acc_levy(numeric, uuid, varchar) TO authenticated;