import { supabase } from '../lib/supabase';
import { AdminMetrics, TenantSettings } from '../types/admin';

export async function getAdminMetrics(tenantId: string): Promise<AdminMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('admin_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return null;
  }
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return null;
  }
}

export async function updateTenantSettings(
  tenantId: string,
  settings: Partial<TenantSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings'
    };
  }
}

export async function logTenantActivity(
  tenantId: string,
  userId: string,
  type: 'user' | 'timesheet' | 'leave' | 'document',
  description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tenant_activity')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        type,
        description
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log activity'
    };
  }
}