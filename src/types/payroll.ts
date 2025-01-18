import { PayrollCalculationLog } from './index';

export interface PayrollCalculationDetailsProps {
  logs: PayrollCalculationLog[];
}

export interface PayrollSummary {
  grossPay: number;
  kiwiSaverDeduction: number;
  employerKiwiSaver: number;
  payeTax: number;
  accLevy: number;
  netPay: number;
  ytdTotals?: {
    earnings: {
      gross: number;
      taxable: number;
      nontaxable: number;
    };
    deductions: {
      paye: number;
      acc: number;
      kiwisaver: number;
      total: number;
    };
  };
  minimumWageCheck?: {
    compliant: boolean;
    requiredRate: number;
    actualRate: number;
  };
}