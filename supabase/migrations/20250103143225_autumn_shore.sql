/*
  # Add authentication policies

  1. Security
    - Enable RLS on auth tables
    - Add policies for user authentication
    - Add policies for user profile access
*/

-- Enable RLS on auth tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Add policies for users table
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Add policies for employee_profiles table
CREATE POLICY "Users can view own employee profile"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own employee profile"
  ON employee_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add policies for tenant access
CREATE POLICY "Users can view own tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  ));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;