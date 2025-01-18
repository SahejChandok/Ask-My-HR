/*
  # Add employee management fields and constraints

  1. Changes
    - Add active status field to employee_profiles
    - Add IRD number field
    - Add employment type (hourly/salary)
    - Add unique constraint for IRD numbers within tenant

  2. Security
    - No changes to RLS policies
*/

-- Add new fields to employee_profiles
ALTER TABLE employee_profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ird_number varchar(9),
ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('hourly', 'salary')) DEFAULT 'hourly';

-- Add unique constraint for IRD numbers within tenant
ALTER TABLE employee_profiles
ADD CONSTRAINT unique_ird_per_tenant UNIQUE (ird_number, tenant_id);

-- Update existing employee records
UPDATE employee_profiles SET
  ird_number = CASE id
    WHEN '33333333-3333-3333-3333-333333333333' THEN '123456789'
    WHEN '44444444-4444-4444-4444-444444444444' THEN '234567890'
    WHEN '55555555-5555-5555-5555-555555555555' THEN '345678901'
    WHEN '66666666-6666-6666-6666-666666666666' THEN '456789012'
  END,
  employment_type = 'hourly'
WHERE id IN (
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);