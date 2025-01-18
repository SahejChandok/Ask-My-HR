import { supabase } from '../lib/supabase';
import { PayrollRun } from '../types';
import { formatDisplayDate } from './dateUtils';

interface ValidationResult {
  valid: boolean;
  message?: string;
  overlappingRuns?: PayrollRun[];
  details?: {
    pendingTimesheets?: number;
    overlappingPeriods?: string[];
  };
}

export async function validatePayrollPeriod(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<ValidationResult> {
  try {
    // Validate date order
    if (new Date(endDate) < new Date(startDate)) {
      return {
        valid: false,
        message: 'End date must be after start date'
      };
    }

    // Get existing payroll runs for this period with more precise overlap check
    const { data: overlappingRuns, error } = await supabase
      .from('payroll_runs') 
      .select('*') 
      .eq('tenant_id', tenantId) 
      .neq('status', 'cancelled')
      .neq('status', 'voided')
      .or(`period_start.lte.${endDate},period_end.gte.${startDate}`)
      .order('period_start', { ascending: true });

    if (error) throw error;

    if (overlappingRuns && overlappingRuns.length > 0) {
      // Filter out any non-overlapping runs
      const actualOverlaps = overlappingRuns.filter(run => {
        const runStart = new Date(run.period_start);
        const runEnd = new Date(run.period_end);
        const periodStart = new Date(startDate);
        const periodEnd = new Date(endDate);
        return runStart <= periodEnd && runEnd >= periodStart;
      });

      if (actualOverlaps.length > 0) {
        const formattedMessage = actualOverlaps
          .map(run => 
            `${formatDisplayDate(run.period_start)} - ${formatDisplayDate(run.period_end)} (${run.status})`
          )
          .join('\n');

        return {
          valid: false,
          message: 'A payroll run already exists for this period',
          overlappingRuns: actualOverlaps,
        };
      }
    }

    // Check if all timesheets are approved
    const { data: timesheets, error: timesheetsError } = await supabase
      .from('timesheets')
      .select('status')
      .eq('tenant_id', tenantId)
      .gte('period_start', startDate)
      .lte('period_end', endDate);

    if (timesheetsError) throw timesheetsError;

    const pendingTimesheets = timesheets?.filter(t => t.status !== 'approved') || [];
    if (pendingTimesheets.length > 0) {
      return {
        valid: false,
        message: `${pendingTimesheets.length} timesheet(s) require approval before running payroll`,
        details: {
          pendingTimesheets: pendingTimesheets.length
        }
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating payroll period:', error);
    return {
      valid: false,
      message: 'An error occurred while validating the pay period',
      overlappingRuns: []
    };
  }
}