/*
  # Add email field to employee profiles

  1. Changes
    - Add email field to employee_profiles table
    - Add unique constraint for email within tenant
    - Update existing employee records with email field
*/

-- Add email field
ALTER TABLE employee_profiles
ADD COLUMN IF NOT EXISTS email text;

-- Add unique constraint for email within tenant
ALTER TABLE employee_profiles
ADD CONSTRAINT unique_email_per_tenant UNIQUE (email, tenant_id);

-- Update existing employee records with email
UPDATE employee_profiles
SET email = 'tenant.admin@example.com'
WHERE id = '33333333-3333-3333-3333-333333333333'
  AND email IS NULL;

UPDATE employee_profiles
SET email = 'jane.smith@example.com'
WHERE id = '44444444-4444-4444-4444-444444444444'
  AND email IS NULL;

UPDATE employee_profiles
SET email = 'bob.johnson@example.com'
WHERE id = '55555555-5555-5555-5555-555555555555'
  AND email IS NULL;

UPDATE employee_profiles
SET email = 'sarah.williams@example.com'
WHERE id = '66666666-6666-6666-6666-666666666666'
  AND email IS NULL;

-- Make email required
ALTER TABLE employee_profiles
ALTER COLUMN email SET NOT NULL;