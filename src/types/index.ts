export type Role = 'platform_admin' | 'tenant_admin' | 'employee' | 'hr_manager' | 'payroll_admin';
export type IRDFilingFrequency = 'monthly' | 'twice-monthly' | 'payday';
export type IRDFilingStatus = 'pending' | 'submitted' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: Role;
  tenant_id?: string;
  is_verified: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  kiwisaver_rate: number;
  kiwisaver_enrolled: boolean;
  tax_code: string;
  hourly_rate: number;
  shift_rule_group_id?: string;
  is_active: boolean;
  ird_number: string;
  employment_type: 'hourly' | 'salary';
  created_at: string;
}

export type LeaveType = 'annual' | 'sick' | 'bereavement' | 'public_holiday' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type PayrollStatus = 'draft' | 'processing' | 'completed' | 'cancelled' | 'voided';
export type PayPeriodType = 'weekly' | 'fortnightly' | 'monthly';

export interface IRDFiling {
  id: string;
  filing_type: IRDFilingType;
  period_start: string;
  period_end: string;
  status: IRDFilingStatus;
  submission_date: string;
  response_data: {
    header: {
      total_paye: number;
      total_gross: number;
      employee_count: number;
    };
    employees: Array<{
      ird_number: string;
      name: string;
      tax_code: string;
      gross_earnings: number;
      paye_deducted: number;
      kiwisaver_deductions: number;
    }>;
  };
}

export interface PayrollSettings {
  id: string;
  tenant_id: string;
  pay_period_type: PayPeriodType;
  pay_day: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollRun {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  processed_by: string;
  status: PayrollStatus;
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  gross_pay: number;
  kiwisaver_deduction: number;
  employer_kiwisaver: number;
  paye_tax: number;
  net_pay: number;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  status: TimesheetStatus;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  description?: string;
  is_overtime: boolean;
  overtime_rate: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  tenant_id: string;
  leave_type: LeaveType;
  balance_hours: number;
  accrued_hours: number;
  taken_hours: number;
  year_start: string;
  year_end: string;
  created_at: string;
  updated_at: string;
  employee_profiles?: {
    first_name: string;
    last_name: string;
  };
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  tenant_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  reason?: string;
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  employee_profiles?: {
    first_name: string;
    last_name: string;
  };
}

export interface PayrollCalculationLog {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  log_type: string;
  details: Record<string, any>;
  created_at: string;
}

export interface PayrollResultData {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    employment_type: string;
    kiwisaver_rate: number;
    kiwisaver_enrolled: boolean;
    tax_code: string;
  };
  calculations: {
    grossPay: number;
    kiwiSaverDeduction: number;
    employerKiwiSaver: number;
    payeTax: number;
    accLevy: number;
    accLevyDetails?: {
      ytdEarnings: number;
      remainingCap: number;
    };
    leaveDetails?: {
      hours: number;
      amount: number;
      type: string;
      dates: string[];
    };
    netPay: number;
    minimumWageCheck?: {
      compliant: boolean;
      requiredRate: number;
      actualRate: number;
    };
    leaveDetails?: {
      hours: number;
      amount: number;
      type: string;
      dates: string[];
    };
  };
}