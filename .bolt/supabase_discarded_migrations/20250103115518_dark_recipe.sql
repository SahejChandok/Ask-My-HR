/*
  # Initial Schema Setup for Ask Your HR

  1. Tables
    - tenants: Organizations using the platform
    - users: All system users with role-based access
    - employee_profiles: Extended information for employees
    - roles: Available system roles
    - user_roles: Many-to-many relationship between users and roles

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Set up authentication handling

  3. Enums and Types
    - role_type: Available roles in the system
    - tax_code: NZ tax codes
*/

-- Enable UUID extension
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

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Tenant policies
CREATE POLICY "Platform admins can view all tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

CREATE POLICY "Tenant users can view their own tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = tenants.id
    )
  );

-- User policies
CREATE POLICY "Platform admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'platform_admin'
    )
  );

CREATE POLICY "Tenant admins can view users in their tenant"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'tenant_admin'
      AND u.tenant_id = users.tenant_id
    )
  );

CREATE POLICY "Users can view their own record"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
  );

-- Employee profile policies
CREATE POLICY "Platform admins can view all profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

CREATE POLICY "Tenant admins can view profiles in their tenant"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tenant_admin'
      AND users.tenant_id = employee_profiles.tenant_id
    )
  );

CREATE POLICY "Employees can view their own profile"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Create indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_employee_profiles_tenant_id ON employee_profiles(tenant_id);
CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);