/*
  # Add test employees with different KiwiSaver rates

  1. New Data
    - Add test employees with varying:
      - KiwiSaver rates (0%, 3%, 6%, 8%)
      - Pay rates ($28.50 - $42.75)
      - Tax codes (M, SB)
    - One employee opted out of KiwiSaver
    - All in the demo tenant

  2. Changes
    - Adds sample employees for testing payroll calculations
    - Ensures different KiwiSaver scenarios
*/

-- Add test employees with different KiwiSaver rates and tax codes
INSERT INTO employee_profiles (
  id,
  user_id,
  tenant_id,
  first_name,
  last_name,
  hourly_rate,
  kiwisaver_rate,
  kiwisaver_enrolled,
  tax_code
) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Jane',
  'Smith',
  35.00,
  6.0,
  true,
  'M'
),
(
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Bob',
  'Johnson',
  28.50,
  0.0,
  false,
  'SB'
),
(
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Sarah',
  'Williams',
  42.75,
  8.0,
  true,
  'M'
) ON CONFLICT (id) DO UPDATE SET
  hourly_rate = EXCLUDED.hourly_rate,
  kiwisaver_rate = EXCLUDED.kiwisaver_rate,
  kiwisaver_enrolled = EXCLUDED.kiwisaver_enrolled,
  tax_code = EXCLUDED.tax_code;