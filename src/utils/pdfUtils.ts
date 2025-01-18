import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function mergePDFs(pdfs: Blob[]): Promise<Blob> {
  try {
    // Create a new PDF document
    const mergedPdf = new jsPDF();
    
    for (let i = 0; i < pdfs.length; i++) {
      // Add a new page for each PDF except the first one
      if (i > 0) {
        mergedPdf.addPage();
      }

      try {
        // Convert Blob to ArrayBuffer
        const pdfData = await pdfs[i].arrayBuffer();
        
        // Add the PDF data to the document
        await mergedPdf.addPage();
        await mergedPdf.addFileToVFS(`pdf-${i}.pdf`, pdfData);
      } catch (error) {
        console.error(`Error processing PDF ${i}:`, error);
        // Continue with next PDF instead of failing completely
        continue;
      }
    }
    
    return new Blob([mergedPdf.output('blob')], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw new Error('Failed to merge PDF documents. Please try downloading individual payslips.');
  }
}