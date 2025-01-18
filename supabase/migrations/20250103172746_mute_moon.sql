-- Create a function to check email availability that can be called via RPC
CREATE OR REPLACE FUNCTION public.check_email_availability(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  email_exists boolean;
BEGIN
  -- Check auth.users table
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) INTO email_exists;

  IF email_exists THEN
    RETURN false;
  END IF;

  -- Check employee_profiles table
  SELECT EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) INTO email_exists;

  RETURN NOT email_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant RPC access to the function
GRANT EXECUTE ON FUNCTION public.check_email_availability(text, uuid, uuid) TO authenticated;

-- Create policy to allow access to the function
CREATE POLICY "Allow authenticated access to check_email_availability"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());