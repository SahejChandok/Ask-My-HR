import { supabase } from '../lib/supabase';
import { submitIRDFiling } from './irdService';

interface FilingSchedule {
  tenant_id: string;
  frequency: 'monthly' | 'twice-monthly' | 'payday';
  last_filing_date: string;
}

export async function checkFilingSchedule(tenantId: string): Promise<{
  due: boolean;
  nextDueDate: Date | null;
}> {
  const { data: config } = await supabase
    .from('ird_filing_config')
    .select('filing_frequency, last_filing_date')
    .eq('tenant_id', tenantId)
    .single();

  if (!config) {
    return { due: false, nextDueDate: null };
  }

  const lastFiling = new Date(config.last_filing_date || '2024-01-01');
  const today = new Date();
  let nextDueDate = new Date(lastFiling);

  switch (config.filing_frequency) {
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
    case 'twice-monthly':
      if (lastFiling.getDate() <= 15) {
        nextDueDate.setDate(lastFiling.getMonth() === today.getMonth() ? 30 : 15);
      } else {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        nextDueDate.setDate(15);
      }
      break;
    case 'payday':
      // Due 2 working days after pay date
      nextDueDate.setDate(nextDueDate.getDate() + 2);
      break;
  }

  return {
    due: today >= nextDueDate,
    nextDueDate
  };
}

export async function processAutomatedFilings(): Promise<void> {
  // Get all tenants with IRD config
  const { data: schedules } = await supabase
    .from('ird_filing_config')
    .select('tenant_id, filing_frequency, last_filing_date');

  if (!schedules) return;

  for (const schedule of schedules) {
    const { due } = await checkFilingSchedule(schedule.tenant_id);
    if (!due) continue;

    // Get unsubmitted payroll runs
    const { data: payrollRuns } = await supabase
      .from('payroll_runs')
      .select('id')
      .eq('tenant_id', schedule.tenant_id)
      .eq('status', 'completed')
      .not('id', 'in', (
        // Exclude already filed runs
        supabase
          .from('ird_filings')
          .select('payroll_run_id')
          .eq('tenant_id', schedule.tenant_id)
      ))
      .order('period_start', { ascending: true });

    if (!payrollRuns?.length) continue;

    // Submit filings for each payroll run
    for (const run of payrollRuns) {
      await submitIRDFiling(run.id, 'ir348');
    }

    // Update last filing date
    await supabase
      .from('ird_filing_config')
      .update({ last_filing_date: new Date().toISOString() })
      .eq('tenant_id', schedule.tenant_id);
  }
}