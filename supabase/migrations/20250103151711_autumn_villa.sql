/*
  # Fix RLS policies and add missing tables
  
  1. Create payroll_settings table
  2. Add missing leave_balances table
  3. Fix RLS policies to prevent recursion
  4. Add proper tenant access controls
*/

-- Create a function to safely get user's tenant ID
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT tenant_id
    FROM users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create payroll_settings table if not exists
CREATE TABLE IF NOT EXISTS payroll_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  pay_period_type pay_period_type NOT NULL DEFAULT 'monthly',
  pay_day integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_pay_day CHECK (
    (pay_period_type = 'monthly' AND pay_day BETWEEN 1 AND 31) OR
    (pay_period_type IN ('weekly', 'fortnightly') AND pay_day BETWEEN 1 AND 7)
  ),
  CONSTRAINT unique_tenant_settings UNIQUE (tenant_id)
);

-- Create leave_balances table if not exists
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  leave_type leave_type NOT NULL,
  balance_hours numeric(10,2) NOT NULL DEFAULT 0,
  accrued_hours numeric(10,2) NOT NULL DEFAULT 0,
  taken_hours numeric(10,2) NOT NULL DEFAULT 0,
  year_start date NOT NULL,
  year_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_year CHECK (year_end >= year_start)
);

-- Enable RLS
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies
CREATE POLICY "tenant_access" ON payroll_settings
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "tenant_access" ON leave_balances
  FOR ALL
  TO authenticated
  USING (tenant_id = get_auth_tenant_id());

-- Insert default settings for demo tenant
INSERT INTO payroll_settings (tenant_id, pay_period_type, pay_day)
VALUES ('11111111-1111-1111-1111-111111111111', 'monthly', 1)
ON CONFLICT (tenant_id) DO NOTHING;

-- Insert initial leave balances for demo user
INSERT INTO leave_balances (
  employee_id,
  tenant_id,
  leave_type,
  balance_hours,
  accrued_hours,
  year_start,
  year_end
) VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'annual', 160, 160, '2024-01-01', '2024-12-31'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'sick', 80, 80, '2024-01-01', '2024-12-31')
ON CONFLICT DO NOTHING;