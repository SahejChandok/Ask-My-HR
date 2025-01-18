/*
  # Fix auth user setup

  1. Changes
    - Ensure auth user has correct metadata format
    - Update password hashing
    - Set proper email confirmation
  
  2. Security
    - Use proper password hashing with bcrypt
    - Ensure user metadata is properly formatted JSON
*/

-- Update auth user if exists to ensure proper setup
UPDATE auth.users
SET 
    encrypted_password = crypt('demo-password', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_user_meta_data = jsonb_build_object(
        'role', 'tenant_admin',
        'tenant_id', '11111111-1111-1111-1111-111111111111'
    )
WHERE id = '22222222-2222-2222-2222-222222222222';