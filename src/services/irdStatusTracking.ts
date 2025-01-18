import { supabase } from '../lib/supabase';
import { IRDFilingStatusData } from '../types/ird';

/**
 * Get filing status for a tenant
 */
export async function getFilingStatus(tenantId: string): Promise<IRDFilingStatusData> {
  try {
    // Get filing config
    const { data: config, error: configError } = await supabase
      .from('ird_filing_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (configError) throw configError;

    // Get pending filings count
    const { count, error: countError } = await supabase
      .from('payroll_runs')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('id', 'in', (
        supabase
          .from('ird_filings')
          .select('payroll_run_id')
          .eq('tenant_id', tenantId)
      ));

    if (countError) throw countError;

    // Calculate next due date
    const lastFiling = config?.last_filing_date ? new Date(config.last_filing_date) : null;
    let nextDueDate = null;

    if (lastFiling) {
      nextDueDate = new Date(lastFiling);
      switch (config.filing_frequency) {
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'twice-monthly':
          if (lastFiling.getDate() <= 15) {
            nextDueDate = new Date(lastFiling.getFullYear(), lastFiling.getMonth(), 30);
          } else {
            nextDueDate = new Date(lastFiling.getFullYear(), lastFiling.getMonth() + 1, 15);
          }
          break;
        case 'payday':
          nextDueDate.setDate(nextDueDate.getDate() + config.file_on_day);
          break;
      }
    }

    return {
      nextDueDate,
      lastFilingDate: config?.last_filing_date || null,
      filingFrequency: config?.filing_frequency || null,
      pendingFilings: count || 0
    };

  } catch (error) {
    console.error('Error getting filing status:', error);
    return {
      nextDueDate: null,
      lastFilingDate: null,
      filingFrequency: null,
      pendingFilings: 0
    };
  }
}