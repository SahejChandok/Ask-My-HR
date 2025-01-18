/*
  # Add unique constraint and test leave balances

  1. Changes
    - Add unique constraint for leave balances
    - Remove any duplicate leave balances
    - Insert test leave balances for employees

  2. Security
    - No changes to RLS policies
*/

-- First remove any duplicate leave balances
DELETE FROM leave_balances
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY employee_id, tenant_id, leave_type, year_start
             ORDER BY created_at DESC
           ) as row_num
    FROM leave_balances
  ) t
  WHERE t.row_num > 1
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_leave_balance'
  ) THEN
    ALTER TABLE leave_balances
    ADD CONSTRAINT unique_leave_balance 
    UNIQUE (employee_id, tenant_id, leave_type, year_start);
  END IF;
END $$;

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
)
ON CONFLICT (employee_id, tenant_id, leave_type, year_start) 
DO UPDATE SET
  balance_hours = EXCLUDED.balance_hours,
  accrued_hours = EXCLUDED.accrued_hours,
  taken_hours = EXCLUDED.taken_hours;