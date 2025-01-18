import { supabase } from '../../lib/supabase';
import { Role } from '../../types';

interface TestUser {
  email: string;
  role: Role;
  tenantId: string;
}

export async function createTestTenant(name: string): Promise<string> {
  const { data, error } = await supabase
    .from('tenants')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function createTestUser(user: TestUser): Promise<string> {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: 'test-password',
    options: {
      data: {
        role: user.role,
        tenant_id: user.tenantId
      }
    }
  });

  if (authError) throw authError;

  // Create public user record
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenantId,
      is_verified: true
    })
    .select()
    .single();

  if (userError) throw userError;

  return userData.id;
}

export async function cleanupTestData() {
  // Delete test users
  await supabase
    .from('users')
    .delete()
    .like('email', '%@test.com');

  // Delete test tenants
  await supabase
    .from('tenants')
    .delete()
    .like('name', 'Test Tenant%');
}