/*
  # Add test data with existence checks

  1. New Data
    - Create test tenant "ACME Corporation" if not exists
    - Create tenant admin user with demo credentials if not exists
    - Create employee profile for tenant admin if not exists
  
  2. Security
    - Ensure proper order of operations for foreign key constraints
    - Set up initial user with verified email
    - Use DO blocks for conditional inserts
*/

DO $$
BEGIN
    -- Insert test tenant if not exists
    IF NOT EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = '11111111-1111-1111-1111-111111111111'
    ) THEN
        INSERT INTO tenants (id, name)
        VALUES ('11111111-1111-1111-1111-111111111111', 'ACME Corporation');
    END IF;

    -- Insert auth user if not exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = '22222222-2222-2222-2222-222222222222'
    ) THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data
        ) VALUES (
            '22222222-2222-2222-2222-222222222222',
            'tenant.admin@example.com',
            crypt('demo-password', gen_salt('bf')),
            now(),
            jsonb_build_object(
                'role', 'tenant_admin',
                'tenant_id', '11111111-1111-1111-1111-111111111111'
            )
        );
    END IF;

    -- Insert public user if not exists
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = '22222222-2222-2222-2222-222222222222'
    ) THEN
        INSERT INTO users (
            id,
            email,
            role,
            tenant_id,
            is_verified
        ) VALUES (
            '22222222-2222-2222-2222-222222222222',
            'tenant.admin@example.com',
            'tenant_admin',
            '11111111-1111-1111-1111-111111111111',
            true
        );
    END IF;

    -- Insert employee profile if not exists
    IF NOT EXISTS (
        SELECT 1 FROM employee_profiles 
        WHERE id = '33333333-3333-3333-3333-333333333333'
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