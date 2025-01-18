import { supabase } from '../lib/supabase';
import { TenantShiftConfig, EmployeeShiftOverrides } from '../types/shift';

export async function getShiftRuleGroups(tenantId: string): Promise<TenantShiftConfig[]> {
  const { data, error } = await supabase
    .from('tenant_shift_config')
    .select(`
      id,
      tenant_id,
      name,
      location,
      time_rules,
      rate_multipliers,
      allowances,
      roster_rules,
      enabled,
      created_at,
      updated_at
    `)
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) throw error;

  // Transform snake_case to camelCase
  return (data || []).map(record => ({
    ...record,
    timeRules: record.time_rules,
    rateMultipliers: record.rate_multipliers,
    rosterRules: record.roster_rules
  }));
}

export async function createShiftRuleGroup(
  tenantId: string,
  config: Partial<TenantShiftConfig>
): Promise<TenantShiftConfig> {
  const dbConfig = {
    tenant_id: tenantId,
    name: config.name,
    location: config.location || 'all',
    time_rules: config.timeRules || {
      standardHours: { daily: 8, weekly: 40, fortnightly: 80 },
      breakRules: { minimumBreak: 30, paidBreak: false, breakFrequency: 4, maxWorkBeforeBreak: 5 },
      overtimeThresholds: { daily: 8, weekly: 40, fortnightly: 80 }
    },
    rate_multipliers: config.rateMultipliers || {
      overtime: { rate1: 1.5, rate2: 2.0, threshold: 4 },
      weekend: { saturday: 1.25, sunday: 1.5 },
      publicHoliday: { rate: 2.0, alternativeHoliday: true },
      nightShift: { rate: 1.15, startTime: "22:00", endTime: "06:00" }
    },
    allowances: config.allowances || {
      mealAllowance: { amount: 15.00, minimumHours: 8 },
      transportAllowance: { amount: 10.00, applicableShifts: ["night", "weekend"] }
    },
    roster_rules: config.rosterRules || {
      minimumRestPeriod: 11,
      maximumConsecutiveDays: 7,
      maximumWeeklyHours: 50,
      noticeRequired: 48,
      preferredDaysOff: ["Saturday", "Sunday"]
    },
    enabled: config.enabled
  };

  const { data, error } = await supabase
    .from('tenant_shift_config')
    .insert([dbConfig])
    .select()
    .single();

  if (error) throw error;

  // Transform snake_case to camelCase
  return {
    ...data,
    timeRules: data.time_rules,
    rateMultipliers: data.rate_multipliers,
    rosterRules: data.roster_rules
  };
}

export async function updateShiftRuleGroup(
  id: string,
  config: Partial<TenantShiftConfig>
): Promise<void> {
  const dbConfig = {
    name: config.name,
    location: config.location || 'all',
    time_rules: config.timeRules,
    rate_multipliers: config.rateMultipliers,
    allowances: config.allowances,
    roster_rules: config.rosterRules,
    enabled: config.enabled
  };

  const { error } = await supabase
    .from('tenant_shift_config')
    .update(dbConfig)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteShiftRuleGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('tenant_shift_config')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getEmployeeShiftOverrides(
  employeeId: string
): Promise<EmployeeShiftOverrides | null> {
  const { data, error } = await supabase
    .from('employee_shift_overrides')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateEmployeeShiftOverrides(
  employeeId: string,
  overrides: Partial<EmployeeShiftOverrides>
): Promise<void> {
  const { error } = await supabase
    .from('employee_shift_overrides')
    .upsert({
      employee_id: employeeId,
      ...overrides
    });

  if (error) throw error;
}