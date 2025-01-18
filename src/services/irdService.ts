import { supabase } from '../lib/supabase';
import { IRDConfig, IRDFiling, IRDFilingStatusData } from '../types/ird';
import { isDevelopment } from '../utils/environment';
import { validateIRDNumber } from '../utils/irdValidation';

/**
 * Get IRD configuration for a tenant
 */
export async function getIRDConfig(tenantId: string): Promise<IRDConfig | null> {
  const { data, error } = await supabase
    .from('ird_filing_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching IRD config:', error);
    return null;
  }

  return data;
}

/**
 * Save IRD configuration for a tenant
 */
export async function updateIRDConfig(
  tenantId: string,
  config: Partial<IRDConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate IRD number format
    if (config.ird_number && !validateIRDNumber(config.ird_number)) {
      throw new Error('Invalid IRD number format or checksum');
    }

    // Validate auto-filing settings
    if (config.auto_file && (!config.file_on_day || config.file_on_day < 1 || config.file_on_day > 5)) {
      throw new Error('Auto-filing requires a valid filing day between 1 and 5');
    }

    // Skip validation in development mode
    if (isDevelopment()) {
      console.log('Development mode: Skipping IRD validation');
    }

    // Save configuration
    const { error: saveError } = await supabase
      .from('ird_filing_config') 
      .upsert(
        {
          tenant_id: tenantId,
          ird_number: config.ird_number || '123456789',
          filing_frequency: config.filing_frequency || 'payday',
          auto_file: config.auto_file ?? false,
          file_on_day: config.file_on_day ?? 2,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'tenant_id' }
      );

    if (saveError) throw saveError;

    return { success: true };
  } catch (error) {
    console.error('Error saving IRD config:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save configuration'
    };
  }
}

// Re-export as saveIRDConfig for backward compatibility
export const saveIRDConfig = updateIRDConfig;

export async function getFilingStatus(tenantId: string): Promise<IRDFilingStatusData> {
  try {
    // First check if config exists
    const config = await getIRDConfig(tenantId);
    if (!config) {
      return {
        nextDueDate: null,
        lastFilingDate: null,
        filingFrequency: null,
        pendingFilings: 0
      };
    }

    const { data: status, error } = await supabase
      .rpc('check_filing_status', { p_tenant_id: tenantId });

    if (error) {
      // Return default values if RPC fails
      return {
        nextDueDate: null,
        lastFilingDate: null,
        filingFrequency: 'payday',
        pendingFilings: 0
      };
    }

    return {
      nextDueDate: status.next_filing_date ? new Date(status.next_filing_date) : null,
      lastFilingDate: status.last_filing_date,
      filingFrequency: status.filing_frequency,
      pendingFilings: status.pending_filings
    };
  } catch (error) {
    console.error('Error getting filing status:', error);
    return {
      nextDueDate: null,
      lastFilingDate: null,
      filingFrequency: 'payday',
      pendingFilings: 0
    };
  }
}

export async function getIRDFilings(tenantId: string): Promise<IRDFiling[]> {
  const { data, error } = await supabase
    .from('ird_filings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('period_start', { ascending: false });

  if (error) {
    console.error('Error fetching IRD filings:', error);
    return [];
  }

  return data || [];
}

export async function submitIRDFiling(
  payrollRunId: string,
  filingType: 'ir348' | 'ei' = 'ir348'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .rpc('submit_ird_filing', {
        p_payroll_run_id: payrollRunId,
        p_filing_type: filingType
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error submitting IRD filing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit filing'
    };
  }
}