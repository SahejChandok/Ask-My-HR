/*
  # Add Leave Balances Table and Fix Policies

  1. New Tables
    - `leave_balances`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employee_profiles)
      - `tenant_id` (uuid, references tenants)
      - `leave_type` (leave_type enum)
      - `balance_hours` (numeric)
      - `accrued_hours` (numeric)
      - `taken_hours` (numeric)
      - `year_start` (date)
      - `year_end` (date)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policy for tenant access
*/

-- Create leave_balances table
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

-- Create indexes
CREATE INDEX idx_leave_balances_employee_id ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_tenant_id ON leave_balances(tenant_id);

-- Enable RLS
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Add policy for leave_balances
CREATE POLICY "Users can view leave balances in tenant"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      LIMIT 1
    )
  );

-- Insert initial leave balance for demo user
INSERT INTO leave_balances (
  employee_id,
  tenant_id,
  leave_type,
  balance_hours,
  accrued_hours,
  taken_hours,
  year_start,
  year_end
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'annual',
  160.00,  -- 4 weeks annual leave
  160.00,
  0.00,
  '2024-01-01',
  '2024-12-31'
), (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'sick',
  80.00,  -- 2 weeks sick leave
  80.00,
  0.00,
  '2024-01-01',
  '2024-12-31'
);