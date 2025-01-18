import { supabase } from '../lib/supabase';

interface ScheduleValidationResult {
  valid: boolean;
  message?: string;
  details?: {
    nextDueDate: Date;
    daysUntilDue: number;
    pendingFilings: number;
  };
}

export async function validateFilingSchedule(
  tenantId: string
): Promise<ScheduleValidationResult> {
  try {
    // Get IRD config
    const { data: config, error: configError } = await supabase
      .from('ird_filing_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (configError) throw configError;
    if (!config) {
      return {
        valid: false,
        message: 'IRD filing not configured'
      };
    }

    // Calculate next due date
    const lastFiling = config.last_filing_date ? new Date(config.last_filing_date) : new Date();
    const today = new Date();
    let nextDueDate = new Date(lastFiling);

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

    // Get count of pending filings
    const { count: pendingCount } = await supabase
      .from('ird_filings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      valid: daysUntilDue > 0,
      message: daysUntilDue <= 0 ? 'Filing overdue' : undefined,
      details: {
        nextDueDate,
        daysUntilDue,
        pendingFilings: pendingCount || 0
      }
    };
  } catch (error) {
    console.error('Error validating filing schedule:', error);
    return {
      valid: false,
      message: 'Failed to validate filing schedule'
    };
  }
}