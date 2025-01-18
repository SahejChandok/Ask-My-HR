/*
  # Add Payroll Settings Table and Fix Policies

  1. New Tables
    - `payroll_settings`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants)
      - `pay_period_type` (enum)
      - `pay_day` (integer)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add non-recursive policy for tenant access
*/

-- Create pay period type enum
CREATE TYPE pay_period_type AS ENUM ('weekly', 'fortnightly', 'monthly');

-- Create payroll_settings table
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

-- Create index
CREATE INDEX idx_payroll_settings_tenant_id ON payroll_settings(tenant_id);

-- Enable RLS
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

-- Add non-recursive policy for payroll settings
CREATE POLICY "Users can view payroll settings in tenant"
  ON payroll_settings
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

-- Add policy for updating payroll settings
CREATE POLICY "Users can update payroll settings in tenant"
  ON payroll_settings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      LIMIT 1
    )
  );

-- Insert default settings for demo tenant
INSERT INTO payroll_settings (
  tenant_id,
  pay_period_type,
  pay_day
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'monthly',
  1
);