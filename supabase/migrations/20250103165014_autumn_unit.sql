/*
  # Add test timesheets and leave requests

  1. New Data
    - Add test timesheets for each employee
    - Add leave requests with different statuses
    - Ensure data covers current pay period

  2. Changes
    - Creates sample timesheet entries
    - Creates sample leave requests
    - Sets up realistic test scenarios
*/

-- Add test timesheets
INSERT INTO timesheets (
  id,
  employee_id,
  tenant_id,
  period_start,
  period_end,
  status,
  submitted_at,
  approved_at
) VALUES 
(
  '77777777-7777-7777-7777-777777777777',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '2024-03-01',
  '2024-03-07',
  'approved',
  now(),
  now()
),
(
  '88888888-8888-8888-8888-888888888888',
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  '2024-03-01',
  '2024-03-07',
  'approved',
  now(),
  now()
),
(
  '99999999-9999-9999-9999-999999999999',
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  '2024-03-01',
  '2024-03-07',
  'approved',
  now(),
  now()
);

-- Add timesheet entries
INSERT INTO timesheet_entries (
  timesheet_id,
  date,
  start_time,
  end_time,
  break_minutes,
  description
) VALUES 
-- Jane's entries
(
  '77777777-7777-7777-7777-777777777777',
  '2024-03-04',
  '09:00',
  '17:00',
  30,
  'Regular day'
),
(
  '77777777-7777-7777-7777-777777777777',
  '2024-03-05',
  '09:00',
  '17:00',
  30,
  'Regular day'
),
-- Bob's entries
(
  '88888888-8888-8888-8888-888888888888',
  '2024-03-04',
  '08:00',
  '16:30',
  30,
  'Regular day'
),
(
  '88888888-8888-8888-8888-888888888888',
  '2024-03-05',
  '08:00',
  '18:00',
  30,
  'Overtime'
),
-- Sarah's entries
(
  '99999999-9999-9999-9999-999999999999',
  '2024-03-04',
  '09:30',
  '17:30',
  30,
  'Regular day'
),
(
  '99999999-9999-9999-9999-999999999999',
  '2024-03-05',
  '09:30',
  '17:30',
  30,
  'Regular day'
);

-- Add leave requests
INSERT INTO leave_requests (
  id,
  employee_id,
  tenant_id,
  leave_type,
  start_date,
  end_date,
  status,
  reason,
  submitted_at
) VALUES 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'annual',
  '2024-03-11',
  '2024-03-15',
  'approved',
  'Family vacation',
  now()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'sick',
  '2024-03-07',
  '2024-03-07',
  'approved',
  'Doctor appointment',
  now()
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'annual',
  '2024-03-18',
  '2024-03-19',
  'pending',
  'Short break',
  now()
);