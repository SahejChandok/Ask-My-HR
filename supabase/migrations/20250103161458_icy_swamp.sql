-- Add missing employee profile for demo user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM employee_profiles 
    WHERE user_id = '22222222-2222-2222-2222-222222222222'
  ) THEN
    INSERT INTO employee_profiles (
      id,
      user_id,
      tenant_id,
      first_name,
      last_name,
      hourly_rate,
      kiwisaver_rate,
      tax_code
    ) VALUES (
      '33333333-3333-3333-3333-333333333333',
      '22222222-2222-2222-2222-222222222222',
      '11111111-1111-1111-1111-111111111111',
      'Admin',
      'User',
      45.00,
      3.0,
      'M'
    );
  END IF;
END $$;