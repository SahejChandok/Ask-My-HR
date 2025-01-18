/*
  # Timesheet and Leave Management

  1. New Tables
    - timesheets: Daily work records
    - timesheet_entries: Individual time entries
    - leave_requests: Employee leave applications
    - leave_balances: Employee leave entitlements

  2. Security
    - Enable RLS on all tables
    - Add policies for employee submission and manager approval
*/

-- Create custom types
CREATE TYPE leave_type AS ENUM (
  'annual',
  'sick',
  'bereavement',
  'public_holiday',
  'other'
);

CREATE TYPE leave_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TYPE timesheet_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected'
);

-- Create tables
CREATE TABLE timesheets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status timesheet_status DEFAULT 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

CREATE TABLE timesheet_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  timesheet_id uuid REFERENCES timesheets(id) NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_minutes integer DEFAULT 0,
  description text,
  is_overtime boolean DEFAULT false,
  overtime_rate numeric(3,2) DEFAULT 1.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_times CHECK (end_time > start_time),
  CONSTRAINT valid_break CHECK (break_minutes >= 0)
);

CREATE TABLE leave_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status leave_status DEFAULT 'pending',
  reason text,
  submitted_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE TABLE leave_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  leave_type leave_type NOT NULL,
  balance_hours numeric(10,2) NOT NULL DEFAULT 0,
  accrued_hours numeric(10,2) NOT NULL DEFAULT 0,
  taken_hours numeric(10,2) NOT NULL DEFAULT 0,
  year_start date NOT NULL,
  year_end date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_year CHECK (year_end > year_start),
  CONSTRAINT positive_balances CHECK (
    balance_hours >= 0 AND
    accrued_hours >= 0 AND
    taken_hours >= 0
  )
);

-- Enable Row Level Security
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Timesheet policies
CREATE POLICY "Employees can view and edit their own timesheets"
  ON timesheets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles ep
      WHERE ep.id = timesheets.employee_id
      AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view and approve timesheets in their tenant"
  ON timesheets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = timesheets.tenant_id
      AND users.role IN ('tenant_admin', 'hr_manager', 'payroll_admin')
    )
  );

-- Timesheet entries policies
CREATE POLICY "Users can view and edit their own timesheet entries"
  ON timesheet_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timesheets t
      JOIN employee_profiles ep ON t.employee_id = ep.id
      WHERE t.id = timesheet_entries.timesheet_id
      AND ep.user_id = auth.uid()
    )
  );

-- Leave request policies
CREATE POLICY "Employees can manage their own leave requests"
  ON leave_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles ep
      WHERE ep.id = leave_requests.employee_id
      AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view and approve leave requests in their tenant"
  ON leave_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = leave_requests.tenant_id
      AND users.role IN ('tenant_admin', 'hr_manager')
    )
  );

-- Leave balance policies
CREATE POLICY "Employees can view their own leave balances"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles ep
      WHERE ep.id = leave_balances.employee_id
      AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view leave balances in their tenant"
  ON leave_balances
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = leave_balances.tenant_id
      AND users.role IN ('tenant_admin', 'hr_manager')
    )
  );

-- Create indexes
CREATE INDEX idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX idx_timesheets_tenant_id ON timesheets(tenant_id);
CREATE INDEX idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_tenant_id ON leave_requests(tenant_id);
CREATE INDEX idx_leave_balances_employee_id ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_tenant_id ON leave_balances(tenant_id);