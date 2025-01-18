-- Drop existing functions first
DROP FUNCTION IF EXISTS public.validate_employee_email(text, uuid, uuid);

-- Create email validation function that returns jsonb
CREATE OR REPLACE FUNCTION public.validate_employee_email(
  p_email text,
  p_tenant_id uuid,
  p_exclude_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Basic format validation
  IF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Please enter a valid email address'
    );
  END IF;

  -- Check auth.users first (excluding the employee being updated)
  IF EXISTS (
    SELECT 1 FROM auth.users au
    JOIN users u ON au.id = u.id
    JOIN employee_profiles ep ON u.id = ep.user_id
    WHERE au.email = p_email
    AND ep.tenant_id != p_tenant_id
    AND (p_exclude_id IS NULL OR ep.id != p_exclude_id)
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Email address is already registered to another organization'
    );
  END IF;

  -- Check employee_profiles within tenant
  IF EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE email = p_email 
    AND tenant_id = p_tenant_id
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Email address is already in use within your organization'
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.validate_employee_email(text, uuid, uuid) TO authenticated;