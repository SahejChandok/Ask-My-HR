-- Drop and recreate the email validation function with better error handling
CREATE OR REPLACE FUNCTION public.check_email_availability(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Check auth.users and users tables together
  SELECT u.id, u.tenant_id 
  INTO existing_user
  FROM auth.users au
  JOIN users u ON au.id = u.id
  WHERE au.email = p_email
  LIMIT 1;

  -- If user exists in another tenant, return false
  IF existing_user.id IS NOT NULL AND existing_user.tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'This email address is already registered to another organization';
  END IF;

  -- Check employee_profiles within current tenant
  IF EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) THEN
    RAISE EXCEPTION 'This email address is already in use within your organization';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the employee insert trigger to use the new validation
CREATE OR REPLACE FUNCTION before_employee_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email using the check_email_availability function
  IF NOT check_email_availability(NEW.email, NEW.tenant_id) THEN
    -- The function will raise its own exception with a specific message
    RETURN NULL;
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

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.check_email_availability(text, uuid, uuid) TO authenticated;