import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { IRDFiling } from '../types/ird';
import { formatDisplayDate } from './dateUtils';
import { formatCurrency } from './formatters';

export function generateIRDFilingPDF(filing: IRDFiling): Blob {
  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: `IRD Filing - ${formatDisplayDate(filing.period_start)}`,
    subject: `IRD Filing Report for period ${formatDisplayDate(filing.period_start)} to ${formatDisplayDate(filing.period_end)}`,
    creator: 'Ask Your HR',
    author: 'Ask Your HR'
  });

  // Header
  doc.setFontSize(20);
  doc.text('IRD Filing Report', doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Period: ${formatDisplayDate(filing.period_start)} - ${formatDisplayDate(filing.period_end)}`, 
    doc.internal.pageSize.width / 2, 30, { align: 'center' });

  // Summary
  (doc as any).autoTable({
    startY: 40,
    head: [['Summary', '']],
    body: [
      ['Filing Type', filing.filing_type.toUpperCase()],
      ['Status', filing.status.toUpperCase()],
      ['Total PAYE', formatCurrency(filing.response_data?.header.total_paye || 0)],
      ['Total Gross', formatCurrency(filing.response_data?.header.total_gross || 0)],
      ['Employee Count', filing.response_data?.header.employee_count || 0]
    ],
    theme: 'grid',
    headStyles: { fillColor: [75, 85, 99] }
  });

  // Employee Details
  if (filing.response_data?.employees.length) {
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Name', 'IRD Number', 'Tax Code', 'Gross', 'PAYE', 'KiwiSaver']],
      body: filing.response_data.employees.map(emp => [
        emp.name,
        emp.ird_number,
        emp.tax_code,
        formatCurrency(emp.gross_earnings),
        formatCurrency(emp.paye_deducted),
        formatCurrency(emp.kiwisaver_deductions)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99] }
    });
  }

  return doc.output('blob');
}

export function generateIRDFilingCSV(filing: IRDFiling): string {
  const rows = [
    ['IRD Filing Report'],
    [`Period: ${formatDisplayDate(filing.period_start)} - ${formatDisplayDate(filing.period_end)}`],
    [''],
    ['Summary'],
    ['Filing Type', filing.filing_type.toUpperCase()],
    ['Status', filing.status.toUpperCase()],
    ['Total PAYE', formatCurrency(filing.response_data?.header.total_paye || 0)],
    ['Total Gross', formatCurrency(filing.response_data?.header.total_gross || 0)],
    ['Employee Count', filing.response_data?.header.employee_count || 0],
    [''],
    ['Employee Details'],
    ['Name', 'IRD Number', 'Tax Code', 'Gross', 'PAYE', 'KiwiSaver']
  ];

  // Add employee rows
  if (filing.response_data?.employees) {
    filing.response_data.employees.forEach(emp => {
      rows.push([
        emp.name,
        emp.ird_number,
        emp.tax_code,
        formatCurrency(emp.gross_earnings),
        formatCurrency(emp.paye_deducted),
        formatCurrency(emp.kiwisaver_deductions)
      ]);
    });
  }

  return rows.map(row => row.join(',')).join('\n');
}