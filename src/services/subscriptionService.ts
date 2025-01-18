import { supabase } from '../lib/supabase';
import { TenantSubscription } from '../types/admin';

export async function getSubscription(tenantId: string): Promise<TenantSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          price,
          max_employees,
          features
        )
      `)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function updateSubscription(
  tenantId: string,
  planId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) throw planError;

    // Update subscription
    const { error: updateError } = await supabase
      .from('tenant_subscriptions')
      .upsert({
        tenant_id: tenantId,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription'
    };
  }
}

export async function cancelSubscription(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tenant_subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    };
  }
}