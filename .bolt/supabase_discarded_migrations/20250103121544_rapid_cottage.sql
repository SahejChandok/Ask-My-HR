/*
  # Add payroll settings

  1. New Tables
    - `payroll_settings`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants)
      - `pay_period_type` (enum: weekly, fortnightly, monthly)
      - `pay_day` (integer, 1-31 for monthly, 1-7 for weekly/fortnightly)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `payroll_settings` table
    - Add policy for payroll admins to manage settings
*/

-- Create pay period type enum
CREATE TYPE pay_period_type AS ENUM (
  'weekly',
  'fortnightly',
  'monthly'
);

-- Create payroll settings table
CREATE TABLE payroll_settings (
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

-- Enable RLS
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Payroll admins can manage settings"
  ON payroll_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = payroll_settings.tenant_id
      AND users.role IN ('tenant_admin', 'payroll_admin')
    )
  );

-- Create indexes
CREATE INDEX idx_payroll_settings_tenant_id ON payroll_settings(tenant_id);