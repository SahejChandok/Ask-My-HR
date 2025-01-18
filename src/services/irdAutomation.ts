import { supabase } from '../lib/supabase';
import { submitIRDFiling } from './irdIntegration';
import { IRDConfig } from '../types/ird';

/**
 * Process automated IRD filings
 */
export async function processAutomatedFilings(): Promise<void> {
  try {
    // Get configs with auto-filing enabled
    const { data: configs, error: configError } = await supabase
      .from('ird_filing_config')
      .select('*')
      .eq('auto_file', true)
      .not('last_filing_date', 'is', null)
      .order('last_filing_date', { ascending: true });

    if (configError) throw configError;

    const processedFilings: string[] = [];
    const errors: Record<string, string> = {};
    const processedFilings: string[] = [];

    for (const config of (configs || [])) {
      try {
        const result = await processConfigFilings(config);
        if (result.success) {
          processedFilings.push(config.tenant_id);
        }
      } catch (error) {
        console.error(`Error processing filings for tenant ${config.tenant_id}:`, error);
        // Continue with next config
        continue;
      }
    }

    console.log(`Processed filings for ${processedFilings.length} tenants`);
    return;

  } catch (error) {
    console.error('Error processing automated filings:', error);
    throw error;
  }
}

async function processConfigFilings(config: IRDConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Get unsubmitted payroll runs
    const { data: runs, error: runsError } = await supabase
      .from('payroll_runs')
      .select('id')
      .eq('tenant_id', config.tenant_id)
      .eq('status', 'completed')
      .not('id', 'in', (
        supabase
          .from('ird_filings')
          .select('payroll_run_id')
          .eq('tenant_id', config.tenant_id)
      ));

    if (runsError) throw new Error(`Failed to fetch payroll runs: ${runsError.message}`);
    if (!runs?.length) return;

    // Submit filings for each run
    for (const run of runs) {
      const { success, error } = await submitIRDFiling(run.id, config.tenant_id);
      
      if (!success) {
        throw new Error(`Failed to submit filing for run ${run.id}: ${error}`);
      }

      if (error) {
        continue;
      }
    }

    // Update last filing date
    await supabase
      .from('ird_filing_config')
      .update({ 
        last_filing_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id);

    return { success: true };


  } catch (error) {
    console.error('Error processing filings for config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}