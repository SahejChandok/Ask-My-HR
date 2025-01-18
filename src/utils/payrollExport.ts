import { PayrollResultData, PayrollRun } from '../types';
import { generatePayslipPDF, generatePayslipCSV } from './payslipGeneration';
import { mergePDFs } from './pdfUtils';
import { formatDisplayDate } from './dateUtils';

export async function exportSinglePayslip(
  payslip: PayrollResultData,
  run: PayrollRun,
  format: 'pdf' | 'csv'
): Promise<void> {
  try {
    const filename = `payslip-${payslip.employee.last_name}-${formatDisplayDate(run.period_start)}`;
    
    if (format === 'csv') {
      const csv = generatePayslipCSV(payslip, run.period_start, run.period_end);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const pdf = await generatePayslipPDF(payslip, run.period_start, run.period_end);
      const url = URL.createObjectURL(pdf);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('Error exporting payslip:', error);
    throw new Error('Failed to export payslip');
  }
}

export async function exportPayrollRun(
  runId: string,
  payslips: PayrollResultData[],
  run: PayrollRun,
  format: 'pdf' | 'csv'
): Promise<void> {
  try {
    const filename = `payroll-run-${formatDisplayDate(run.period_start)}`;
    
    if (format === 'csv') {
      // Generate and download CSV
      const csvContent = payslips
        .map(payslip => generatePayslipCSV(payslip, run.period_start, run.period_end))
        .join('\n\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Generate PDFs sequentially to avoid memory issues
      const pdfs: Blob[] = [];
      for (const payslip of payslips) {
        try {
          const pdf = await generatePayslipPDF(payslip, run.period_start, run.period_end);
          pdfs.push(pdf);
        } catch (error) {
          throw new Error(`Error generating PDF for ${payslip.employee.first_name} ${payslip.employee.last_name}`);
        }
      }

      try {
        // Merge all PDFs into one file
        const mergedPdf = await mergePDFs(pdfs);
        const url = URL.createObjectURL(mergedPdf);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        throw new Error('Failed to merge PDFs. Please try downloading individual payslips.');
      }
    }
  } catch (error) {
    console.error('Error exporting payroll run:', error);
    throw error;
  }
}