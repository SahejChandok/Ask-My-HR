-- Drop existing functions first
DROP FUNCTION IF EXISTS public.check_email_availability(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.before_employee_insert();

-- Create email validation function
CREATE OR REPLACE FUNCTION public.check_email_availability(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  email_exists boolean;
BEGIN
  -- Check auth.users table first
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email
    AND id NOT IN (
      SELECT user_id FROM employee_profiles 
      WHERE tenant_id = p_tenant_id
      AND (p_exclude_id IS NULL OR id = p_exclude_id)
    )
  ) INTO email_exists;

  IF email_exists THEN
    RETURN false;
  END IF;

  -- Then check employee_profiles within tenant
  SELECT EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) INTO email_exists;

  RETURN NOT email_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create employee insert trigger function
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check email availability
  IF NOT check_email_availability(NEW.email, NEW.tenant_id) THEN
    RAISE EXCEPTION 'This email address is already in use';
  END IF;

  -- Check IRD number
  IF EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE ird_number = NEW.ird_number
    AND tenant_id = NEW.tenant_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  ) THEN
    RAISE EXCEPTION 'This IRD number is already registered to another employee';
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_email_availability(text, uuid, uuid) TO authenticated;