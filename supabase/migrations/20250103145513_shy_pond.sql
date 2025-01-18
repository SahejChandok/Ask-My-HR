/*
  # Fix Authentication Schema

  1. Changes
    - Clean up existing auth user
    - Recreate demo user with correct schema
    - Set proper permissions
    - Enable RLS policies
  
  2. Security
    - Enable RLS on auth schema
    - Add proper policies for user access
*/

-- Clean up existing data
DELETE FROM auth.users WHERE email = 'tenant.admin@example.com';

-- Create demo user with correct schema
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    aud,
    role
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'tenant.admin@example.com',
    crypt('demo-password', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', array['email']
    ),
    jsonb_build_object(
        'role', 'tenant_admin',
        'tenant_id', '11111111-1111-1111-1111-111111111111'
    ),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
);

-- Ensure schema permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own auth profile" ON auth.users;
    DROP POLICY IF EXISTS "Public can view auth users" ON auth.users;
    
    -- Create new policies
    CREATE POLICY "Users can view own auth profile"
        ON auth.users
        FOR SELECT
        TO authenticated
        USING (id = auth.uid());
        
    CREATE POLICY "Public can view auth users"
        ON auth.users
        FOR SELECT
        TO anon
        USING (true);
END
$$;