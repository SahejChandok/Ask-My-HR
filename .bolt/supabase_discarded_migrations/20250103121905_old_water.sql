/*
  # Sample Data for Testing

  This migration adds test data for:
  1. Tenants and Users
  2. Employee Profiles
  3. Timesheets and Entries
  4. Leave Requests and Balances
  5. Payroll Settings
*/

-- Insert a test tenant
INSERT INTO tenants (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation');

-- Insert test users
INSERT INTO users (id, email, role, tenant_id, is_verified) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin@acme.com', 'tenant_admin', '11111111-1111-1111-1111-111111111111', true),
  ('33333333-3333-3333-3333-333333333333', 'employee@acme.com', 'employee', '11111111-1111-1111-1111-111111111111', true);

-- Insert employee profiles
INSERT INTO employee_profiles (id, user_id, tenant_id, first_name, last_name, kiwisaver_rate, hourly_rate) VALUES
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'John', 'Doe', 3.0, 25.00);

-- Insert timesheet
INSERT INTO timesheets (id, employee_id, tenant_id, period_start, period_end, status, submitted_at) VALUES
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2024-03-01', '2024-03-07', 'submitted', NOW());

-- Insert timesheet entries (5 workdays)
INSERT INTO timesheet_entries (timesheet_id, date, start_time, end_time, break_minutes) VALUES
  ('55555555-5555-5555-5555-555555555555', '2024-03-01', '09:00', '17:00', 30),
  ('55555555-5555-5555-5555-555555555555', '2024-03-04', '09:00', '17:00', 30),
  ('55555555-5555-5555-5555-555555555555', '2024-03-05', '09:00', '17:00', 30),
  ('55555555-5555-5555-5555-555555555555', '2024-03-06', '09:00', '17:00', 30),
  ('55555555-5555-5555-5555-555555555555', '2024-03-07', '09:00', '18:00', 30);

-- Insert leave balances
INSERT INTO leave_balances (employee_id, tenant_id, leave_type, balance_hours, accrued_hours, taken_hours, year_start, year_end) VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'annual', 80.0, 80.0, 0.0, '2024-01-01', '2024-12-31'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'sick', 40.0, 40.0, 0.0, '2024-01-01', '2024-12-31');

-- Insert a leave request
INSERT INTO leave_requests (employee_id, tenant_id, leave_type, start_date, end_date, status, reason) VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'annual', '2024-03-11', '2024-03-15', 'pending', 'Family vacation');

-- Insert payroll settings
INSERT INTO payroll_settings (tenant_id, pay_period_type, pay_day) VALUES
  ('11111111-1111-1111-1111-111111111111', 'weekly', 5);