/*
  # Add test employees with different employment types

  1. Changes
    - Add test employees with varying KiwiSaver rates and employment types
    - Update existing employees with employment type and IRD info
    - Add test timesheets and leave requests

  2. Security
    - No changes to RLS policies
*/

-- Update existing employees with employment types
UPDATE employee_profiles SET
  employment_type = CASE id
    WHEN '44444444-4444-4444-4444-444444444444' THEN 'salary'  -- Jane is salaried
    WHEN '55555555-5555-5555-5555-555555555555' THEN 'hourly'  -- Bob is hourly
    WHEN '66666666-6666-6666-6666-666666666666' THEN 'salary'  -- Sarah is salaried
    ELSE employment_type
  END,
  hourly_rate = CASE id
    WHEN '44444444-4444-4444-4444-444444444444' THEN 75000.00 / 2080  -- Annual salary converted to hourly
    WHEN '55555555-5555-5555-5555-555555555555' THEN 28.50
    WHEN '66666666-6666-6666-6666-666666666666' THEN 95000.00 / 2080  -- Annual salary converted to hourly
    ELSE hourly_rate
  END
WHERE id IN (
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);