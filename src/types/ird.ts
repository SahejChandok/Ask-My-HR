export type IRDFilingFrequency = 'monthly' | 'twice-monthly' | 'payday';
export type IRDFilingStatus = 'pending' | 'submitted' | 'accepted' | 'rejected';
export type IRDFilingType = 'ir348' | 'ei';

export interface IRDConfig {
  id: string;
  tenant_id: string;
  ird_number: string;
  filing_frequency: IRDFilingFrequency;
  auto_file: boolean;
  file_on_day: number;
  last_filing_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IRDFilingStatusData {
  nextDueDate: Date | null;
  lastFilingDate: string | null;
  filingFrequency: IRDFilingFrequency | null;
  pendingFilings: number;
}

export interface IRDFiling {
  id: string;
  tenant_id: string;
  payroll_run_id: string;
  filing_type: IRDFilingType;
  period_start: string;
  period_end: string;
  status: IRDFilingStatus;
  submission_date: string | null;
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
  } | null;
  error_details: {
    code: string;
    message: string;
    details?: string;
  } | null;
}