/*
  # Initial Schema Setup

  1. Core Tables
    - tenants
    - users
    - employee_profiles
    - timesheets
    - leave_requests
    - payroll_runs
    - payslips

  2. Security
    - Row Level Security (RLS) enabled on all tables
    - Policies for different user roles
    - Proper foreign key constraints

  3. Enums and Types
    - role_type
    - tax_code
    - leave_type
    - timesheet_status
    - payroll_status
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE role_type AS ENUM (
  'platform_admin',
  'tenant_admin',
  'employee',
  'hr_manager',
  'payroll_admin'
);

CREATE TYPE tax_code AS ENUM (
  'M',
  'ME',
  'SB',
  'S',
  'SH',
  'ST',
  'SA'
);

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

CREATE TYPE payroll_status AS ENUM (
  'draft',
  'processing',
  'completed',
  'cancelled'
);

-- Create tables
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  role role_type NOT NULL,
  tenant_id uuid REFERENCES tenants(id),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE employee_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  kiwisaver_rate numeric(4,2) DEFAULT 3.0,
  kiwisaver_enrolled boolean DEFAULT true,
  tax_code tax_code DEFAULT 'M',
  hourly_rate numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE payroll_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  processed_by uuid REFERENCES users(id) NOT NULL,
  status payroll_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

CREATE TABLE payslips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id uuid REFERENCES payroll_runs(id) NOT NULL,
  employee_id uuid REFERENCES employee_profiles(id) NOT NULL,
  gross_pay numeric(10,2) NOT NULL,
  kiwisaver_deduction numeric(10,2) NOT NULL,
  employer_kiwisaver numeric(10,2) NOT NULL,
  paye_tax numeric(10,2) NOT NULL,
  net_pay numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employee_profiles_tenant_id ON employee_profiles(tenant_id);
CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX idx_timesheets_tenant_id ON timesheets(tenant_id);
CREATE INDEX idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_tenant_id ON leave_requests(tenant_id);
CREATE INDEX idx_payroll_runs_tenant_id ON payroll_runs(tenant_id);
CREATE INDEX idx_payroll_runs_period ON payroll_runs(period_start, period_end);
CREATE INDEX idx_payslips_payroll_run_id ON payslips(payroll_run_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);