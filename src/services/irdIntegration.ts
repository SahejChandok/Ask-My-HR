import { irdApi } from '../lib/irdApi';
import { supabase } from '../lib/supabase';
import { IRDFiling } from '../types/ird';

// Maximum retries for filing submission
const MAX_RETRIES = 3;

export async function submitIRDFiling(
  payrollRunId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string; filingId?: string }> {
  try {
    // Get payroll run details
    const { data: run, error: runError } = await supabase
      .from('payroll_runs').select(`
        *,
        payslips (
          employee_id,
          gross_pay,
          paye_tax,
          kiwisaver_deduction,
          employee_profiles (
            ird_number,
            first_name,
            last_name,
            tax_code
          )
        )
      `).eq('id', payrollRunId).single();

    if (runError) throw runError;

    // Get IRD config
    const { data: config, error: configError } = await supabase
      .from('ird_filing_config').select('*')
      .eq('tenant_id', tenantId).single();

    if (configError) throw configError;

    // Format data for IR348
    // Format data for IR348
    const ir348Data = {
      header: {
        irdNumber: config.ird_number,
        period: {
          startDate: run.period_start,
          endDate: run.period_end
        },
        totalPaye: run.payslips.reduce((sum: number, p: any) => sum + p.paye_tax, 0),
        totalGross: run.payslips.reduce((sum: number, p: any) => sum + p.gross_pay, 0),
        employeeCount: run.payslips.length
      },
      employees: run.payslips.map((p: any) => ({
        irdNumber: p.employee_profiles.ird_number,
        name: `${p.employee_profiles.first_name} ${p.employee_profiles.last_name}`,
        taxCode: p.employee_profiles.tax_code,
        grossEarnings: p.gross_pay,
        payeDeducted: p.paye_tax,
        kiwiSaverDeductions: p.kiwisaver_deduction
      }))
    };

    // Submit to IRD
    let attempt = 0;
    let lastError;
    let filingId;

    while (attempt < MAX_RETRIES) {
      const result = await irdApi.submitIR348(ir348Data);
      
      if (result.success) {
        // Update filing status
        const { data: filing } = await supabase.from('ird_filings').insert({
          tenant_id: tenantId,
          payroll_run_id: payrollRunId,
          filing_type: 'ir348',
          period_start: run.period_start,
          period_end: run.period_end,
          status: 'submitted',
          submission_date: new Date().toISOString(),
          response_data: result.data
        }).select().single();

        filingId = filing.id;

        return { success: true, filingId };
      }

      lastError = result.error;
      attempt++;
      
      if (attempt < MAX_RETRIES) {
        // Wait before retrying
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error(lastError?.message || 'Failed to submit filing');

  } catch (error) {
    console.error('Error submitting IRD filing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit filing'
    };
  }
}

export async function checkFilingStatus(filingId: string): Promise<IRDFiling | null> {
  try {
    const result = await irdApi.getFilingStatus(filingId);
    
    if (!result.success) {
      throw new Error(result.error?.message);
    }

    // Update filing status in database
    const { error: updateError } = await supabase
      .from('ird_filings')
      .update({
        status: result.data.status,
        response_data: result.data
      })
      .eq('id', filingId);

    if (updateError) throw updateError;

    return result.data;

  } catch (error) {
    console.error('Error checking filing status:', error);
    return null;
  }
}

export async function getFilingHistory(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<IRDFiling[]> {
  try {
    const result = await irdApi.getFilingHistory(startDate, endDate);
    
    if (!result.success) {
      throw new Error(result.error?.message);
    }

    return result.data;

  } catch (error) {
    console.error('Error getting filing history:', error);
    return [];
  }
}