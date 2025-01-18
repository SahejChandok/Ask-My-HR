import { supabase } from '../lib/supabase';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  filingId?: string;
  details?: {
    errors: string[];
    warnings: string[];
    overlappingPeriods?: string[];
    pendingTimesheets?: number;
  };
}

export interface IRDValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface IRDValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface IRDValidationDetails {
  errors: IRDValidationError[];
  warnings: IRDValidationWarning[];
  overlappingPeriods?: string[];
  pendingTimesheets?: number;
}

// Validation rules
const VALIDATION_RULES = {
  MIN_GROSS_FOR_PAYE: 100,
  MAX_KIWISAVER_RATE: 10,
  MIN_KIWISAVER_RATE: 3,
  VALID_TAX_CODES: ['M', 'ME', 'SB', 'S', 'SH', 'ST', 'SA']
};

// Add validation for IRD number format
export function validateIRDNumber(irdNumber: string): boolean {
  // Basic format check
  const cleanNumber = irdNumber.replace(/\D/g, '');
  if (!/^\d{8,9}$/.test(cleanNumber)) {
    return false;
  }

  // Pad to 9 digits if necessary
  const paddedNumber = cleanNumber.padStart(9, '0');
  
  // Calculate checksum
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(paddedNumber[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  
  return checkDigit === parseInt(paddedNumber[8]);
}

// Add validation for filing period
export function validateFilingPeriod(
  startDate: string,
  endDate: string,
  frequency: string
): ValidationResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    return {
      valid: false,
      message: 'End date must be after start date'
    };
  }

  const periodLength = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  switch (frequency) {
    case 'monthly':
      if (periodLength < 28 || periodLength > 31) {
        return {
          valid: false,
          message: 'Monthly filing period must be approximately one month'
        };
      }
      break;
      
    case 'twice-monthly':
      if (periodLength < 13 || periodLength > 16) {
        return {
          valid: false,
          message: 'Twice-monthly filing period must be approximately 15 days'
        };
      }
      break;
      
    case 'payday':
      if (periodLength > 14) {
        return {
          valid: false,
          message: 'Payday filing must be submitted within 2 working days'
        };
      }
      break;
  }

  return { valid: true };
}

export async function validateIRDFiling(
  payrollRunId: string
): Promise<ValidationResult> {
  try {
    // Check if filing already exists
    const { data: existingFiling } = await supabase
      .from('ird_filings')
      .select('id, status')
      .eq('payroll_run_id', payrollRunId)
      .maybeSingle();

    if (existingFiling) {
      return {
        valid: false,
        message: `Filing already exists with status: ${existingFiling.status}`,
        filingId: existingFiling.id
      };
    }

    // Get payroll run details with employee data
    const { data: run, error: runError } = await supabase
      .from('payroll_runs')
      .select(`
        *,
        payslips (
          employee_id,
          gross_pay,
          paye_tax,
          kiwisaver_deduction,
          employee_profiles (
            ird_number,
            tax_code,
            first_name,
            last_name,
            kiwisaver_enrolled,
            kiwisaver_rate
          )
        )
      `)
      .eq('id', payrollRunId)
      .single();

    if (runError) throw runError;
    if (!run) {
      return {
        valid: false,
        message: 'Payroll run not found'
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each employee
    run.payslips.forEach((payslip: any) => {
      const employee = payslip.employee_profiles;
      const name = `${employee.first_name} ${employee.last_name}`;
      
      // Validate IRD number format and checksum
      if (!employee.ird_number) {
        errors.push(`Missing IRD number for ${name}`);
      } else if (!validateIRDNumber(employee.ird_number)) {
        errors.push(`Invalid IRD number format for ${name}`);
      }

      // Validate tax code
      if (!employee.tax_code) {
        errors.push(`Missing tax code for ${name}`);
      } else if (!VALIDATION_RULES.VALID_TAX_CODES.includes(employee.tax_code)) {
        errors.push(`Invalid tax code "${employee.tax_code}" for ${name}`);
      }

      // Validate KiwiSaver
      if (employee.kiwisaver_enrolled) {
        if (employee.kiwisaver_rate < VALIDATION_RULES.MIN_KIWISAVER_RATE) {
          errors.push(`KiwiSaver rate below minimum ${VALIDATION_RULES.MIN_KIWISAVER_RATE}% for ${name}`);
        }
        if (employee.kiwisaver_rate > VALIDATION_RULES.MAX_KIWISAVER_RATE) {
          errors.push(`KiwiSaver rate above maximum ${VALIDATION_RULES.MAX_KIWISAVER_RATE}% for ${name}`);
        }
      }

      // Check for reasonable amounts
      if (payslip.gross_pay < 0) {
        errors.push(`Negative gross pay for ${name}`);
      }
      if (payslip.paye_tax < 0) {
        errors.push(`Negative PAYE tax for ${name}`);
      }
      if (payslip.kiwisaver_deduction < 0) {
        errors.push(`Negative KiwiSaver deduction for ${name}`);
      }

      // Add warnings
      if (payslip.paye_tax === 0 && payslip.gross_pay > VALIDATION_RULES.MIN_GROSS_FOR_PAYE) {
        warnings.push(`Zero PAYE tax for ${name} with gross pay ${payslip.gross_pay}`);
      }
      if (employee.kiwisaver_enrolled && payslip.kiwisaver_deduction === 0) {
        warnings.push(`No KiwiSaver deduction for enrolled employee ${name}`);
      }
      if (payslip.gross_pay === 0) {
        warnings.push(`Zero gross pay for ${name}`);
      }
    });

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? 'Validation failed' : 'Validation passed',
      details: {
        errors,
        warnings
      }
    };
  } catch (error) {
    console.error('Error validating IRD filing:', error);
    return {
      valid: false,
      message: 'Failed to validate filing'
    };
  }
}