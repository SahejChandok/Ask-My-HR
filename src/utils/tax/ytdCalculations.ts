import { PayrollResultData } from '../../types';

export interface YTDTotals {
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
  net: number;
}

export function calculateYTDTotals(payslips: PayrollResultData[]): YTDTotals {
  return payslips.reduce((totals, { calculations }) => ({
    earnings: {
      gross: totals.earnings.gross + calculations.grossPay,
      taxable: totals.earnings.taxable + calculations.grossPay,
      nontaxable: totals.earnings.nontaxable
    },
    deductions: {
      paye: totals.deductions.paye + calculations.payeTax,
      acc: totals.deductions.acc + (calculations.accLevy || 0),
      kiwisaver: totals.deductions.kiwisaver + calculations.kiwiSaverDeduction,
      total: totals.deductions.total + calculations.payeTax + 
             (calculations.accLevy || 0) + calculations.kiwiSaverDeduction
    },
    net: totals.net + calculations.netPay
  }), {
    earnings: { gross: 0, taxable: 0, nontaxable: 0 },
    deductions: { paye: 0, acc: 0, kiwisaver: 0, total: 0 },
    net: 0
  });
}