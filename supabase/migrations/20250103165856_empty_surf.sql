/*
  # Update leave balances for test employees

  1. Delete existing leave balances to avoid conflicts
  2. Insert new leave balances for test employees
*/

-- First remove any existing leave balances for these employees
DELETE FROM leave_balances 
WHERE employee_id IN (
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);

-- Add test leave balances
INSERT INTO leave_balances (
  employee_id,
  tenant_id,
  leave_type,
  balance_hours,
  accrued_hours,
  taken_hours,
  year_start,
  year_end
) VALUES 
-- Jane's balances
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'annual',
  160.00,
  160.00,
  40.00,
  '2024-01-01',
  '2024-12-31'
),
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'sick',
  80.00,
  80.00,
  8.00,
  '2024-01-01',
  '2024-12-31'
),
-- Bob's balances
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'annual',
  160.00,
  160.00,
  0.00,
  '2024-01-01',
  '2024-12-31'
),
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'sick',
  80.00,
  80.00,
  8.00,
  '2024-01-01',
  '2024-12-31'
),
-- Sarah's balances
(
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'annual',
  160.00,
  160.00,
  16.00,
  '2024-01-01',
  '2024-12-31'
),
(
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'sick',
  80.00,
  80.00,
  0.00,
  '2024-01-01',
  '2024-12-31'
);