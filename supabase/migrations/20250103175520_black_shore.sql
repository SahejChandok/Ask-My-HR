/*
  # Fix employee creation flow

  1. Changes
    - Ensure users table record is created before employee profile
    - Add proper transaction handling
    - Fix foreign key constraint issues
    - Improve error messages

  2. Security
    - Maintain RLS policies
    - Keep security definer functions
*/

-- Create a function to create user records in proper order
CREATE OR REPLACE FUNCTION create_employee_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Start transaction
  BEGIN
    -- Generate UUID and temporary password
    new_user_id := gen_random_uuid();
    temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

    -- First create the auth.users record
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
      ),
      jsonb_build_object(
        'role', p_role,
        'tenant_id', p_tenant_id
      ),
      'authenticated',
      'authenticated'
    );

    -- Then create the users record
    INSERT INTO users (
      id,
      email,
      role,
      tenant_id,
      is_verified
    ) VALUES (
      new_user_id,
      p_email,
      p_role,
      p_tenant_id,
      true
    );

    RETURN new_user_id;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Email already exists';
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the employee insert trigger
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
DECLARE
  validation_result jsonb;
BEGIN
  -- Validate email
  validation_result := validate_employee_email(NEW.email, NEW.tenant_id);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation_result->>'message';
  END IF;

  -- Create user records and get ID
  NEW.user_id := create_employee_user(NEW.email, NEW.tenant_id);

  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create employee: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;

-- Create new trigger
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_employee_user(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION before_employee_insert() TO authenticated;