/*
  # Fix Employee Creation Process

  1. Changes
    - Fix phone number uniqueness handling
    - Update auth user creation to handle phone field correctly
    - Add validation for email uniqueness
*/

-- Drop existing phone constraints safely
DO $$ BEGIN
  -- Drop any existing triggers that might depend on the constraint
  DROP TRIGGER IF EXISTS employee_insert_trigger ON employee_profiles;
  
  -- Drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_phone_key'
  ) THEN
    ALTER TABLE auth.users DROP CONSTRAINT users_phone_key;
  END IF;
  
  -- Drop the index if it exists
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'users_phone_key'
    AND n.nspname = 'auth'
  ) THEN
    DROP INDEX auth.users_phone_key;
  END IF;
END $$;

-- Create new partial index for non-empty phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique 
ON auth.users (phone, instance_id)
WHERE phone != '';

-- Update the auth user creation function
CREATE OR REPLACE FUNCTION create_auth_user(
  p_email text,
  p_tenant_id uuid,
  p_role text DEFAULT 'employee'
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Check for existing email
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  -- Generate UUID and temporary password
  new_user_id := gen_random_uuid();
  temp_password := 'temp-' || encode(gen_random_bytes(12), 'base64');

  -- Create auth user with explicit empty string phone
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    phone,
    created_at,
    updated_at
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
    'authenticated',
    '',
    now(),
    now()
  );

  -- Create public user record
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function to handle errors gracefully
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate employee data
  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE email = NEW.email
    AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Email already exists within tenant';
  END IF;

  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = NEW.ird_number
    AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'IRD number already exists within tenant';
  END IF;

  -- Create auth user and get ID
  BEGIN
    NEW.user_id := create_auth_user(NEW.email, NEW.tenant_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user account: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER employee_insert_trigger
  BEFORE INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION before_employee_insert();