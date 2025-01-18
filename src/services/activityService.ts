import { supabase } from '../lib/supabase';
import { ActivityItem } from '../types/admin';

export async function logActivity(
  tenantId: string,
  userId: string,
  type: 'user' | 'timesheet' | 'leave' | 'document',
  description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('log_tenant_activity', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_type: type,
      p_description: description
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

export async function getRecentActivity(tenantId: string, limit = 5): Promise<ActivityItem[]> {
  try {
    const { data, error } = await supabase
      .from('tenant_activity')
      .select(`
        *,
        users (
          id,
          email,
          employee_profiles (
            first_name,
            last_name
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.created_at,
      user: {
        name: activity.users?.employee_profiles?.first_name 
          ? `${activity.users.employee_profiles.first_name} ${activity.users.employee_profiles.last_name}`
          : activity.users?.email,
        email: activity.users?.email
      }
    }));
  } catch (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
}