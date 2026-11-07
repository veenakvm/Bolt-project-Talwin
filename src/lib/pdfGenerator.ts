import jsPDF from 'jspdf';
import { calculateGSTSummary, numToWords, formatIndianNumber, type LineItem } from './invoiceUtils';

interface Invoice {
  id: string;
  invoice_number: number;
  invoice_date: string;
  place_of_supply: string;
  customer_name: string;
  customer_contact?: string;
  line_items: LineItem[];
  taxable_amount: number;
  gst_total: number;
  sub_total: number;
  round_off: number;
  grand_total: number;
  advance_paid?: number;
  balance_due?: number;
}

export async function generateInvoicePDF(invoice: Invoice) {
  console.log('📄 Generating PDF for invoice:', invoice.invoice_number);
  console.log('📦 Line items:', invoice.line_items);
  console.log('📊 Item count:', invoice.line_items?.length || 0);

  if (!invoice.line_items || invoice.line_items.length === 0) {
    console.error('❌ No line items found in invoice!');
    alert('Error: No products found in this invoice. Please add products before generating PDF.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  // Company Header
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TALWIN AQUARAY', 15, yPos);

  yPos += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Talwin AquaRay (formerly known as "Skanda Agencies")', 15, yPos);
  yPos += 4;
  pdf.text('N0 34, Ground Floor, Nyanappanhalli, 80 Feet Road,', 15, yPos);
  yPos += 4;
  pdf.text('BDA Layout BTM 4th Stage, Bengaluru, Karnataka 560076', 15, yPos);
  yPos += 4;
  pdf.text('Phone: 70224 58515 | Email: info@talwin.in', 15, yPos);
  yPos += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('GSTIN: 29AOQPB3325K1ZQ | State: 29-Karnataka', 15, yPos);

  // Invoice title and details on right side
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 15, 20, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice No: ${invoice.invoice_number}`, pageWidth - 15, 32, { align: 'right' });

  const formattedDate = new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  pdf.text(`Date: ${formattedDate}`, pageWidth - 15, 37, { align: 'right' });
  pdf.text(`Supply: ${invoice.place_of_supply}`, pageWidth - 15, 42, { align: 'right' });

  // Customer details box
  yPos = 50;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 18, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(15, yPos, 15, yPos + 18);

  yPos += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('INVOICE TO', 20, yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.text(invoice.customer_name, 20, yPos);
  if (invoice.customer_contact) {
    yPos += 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contact: ${invoice.customer_contact}`, 20, yPos);
  }

  // Product header bar
  yPos = 72;
  pdf.setFillColor(50, 50, 50);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('#', 17, yPos + 5);
  pdf.text('Item Name', 25, yPos + 5);
  pdf.text('HSN', 95, yPos + 5);
  pdf.text('MRP', 110, yPos + 5, { align: 'right' });
  pdf.text('Qty', 125, yPos + 5, { align: 'right' });
  pdf.text('Unit', 135, yPos + 5);
  pdf.text('Price', 150, yPos + 5, { align: 'right' });
  pdf.text('GST', 165, yPos + 5, { align: 'right' });
  pdf.text('Amount', pageWidth - 17, yPos + 5, { align: 'right' });

  // Product line items
  yPos += 8;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  invoice.line_items.forEach((item, index) => {
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.text(`${index + 1}`, 17, yPos + 4);

    const itemName = item.item_name || '';
    if (itemName.length > 35) {
      pdf.text(itemName.substring(0, 35) + '...', 25, yPos + 4);
    } else {
      pdf.text(itemName, 25, yPos + 4);
    }

    pdf.text(item.hsn_sac || '', 95, yPos + 4);
    pdf.text(item.mrp ? formatIndianNumber(item.mrp) : '—', 110, yPos + 4, { align: 'right' });
    pdf.text(item.quantity.toString(), 125, yPos + 4, { align: 'right' });
    pdf.text(item.unit, 135, yPos + 4);
    pdf.text(`₹${formatIndianNumber(item.price_per_unit)}`, 150, yPos + 4, { align: 'right' });
    pdf.text(`₹${formatIndianNumber(item.gst_amount)}`, 165, yPos + 4, { align: 'right' });
    pdf.text(`₹${formatIndianNumber(item.total_amount)}`, pageWidth - 17, yPos + 4, { align: 'right' });

    yPos += 8;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(15, yPos, pageWidth - 15, yPos);
  });

  // Total quantity and subtotal row
  yPos += 4;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Qty:', 115, yPos + 5, { align: 'right' });
  pdf.text(
    invoice.line_items.reduce((sum, item) => sum + item.quantity, 0).toString(),
    125,
    yPos + 5,
    { align: 'right' }
  );
  pdf.text('Sub Total:', 155, yPos + 5, { align: 'right' });
  pdf.text(`₹${formatIndianNumber(invoice.sub_total)}`, pageWidth - 17, yPos + 5, { align: 'right' });

  // Amount in words and summary section
  yPos += 12;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Amount in Words:', 17, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'italic');
  const words = numToWords(invoice.grand_total);
  const wordLines = pdf.splitTextToSize(words, 90);
  wordLines.forEach((line: string) => {
    pdf.text(line, 17, yPos);
    yPos += 4;
  });

  const summaryYStart = yPos - wordLines.length * 4 - 5;
  let summaryY = summaryYStart;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Sub Total:', pageWidth - 60, summaryY);
  pdf.text(`₹${formatIndianNumber(invoice.sub_total)}`, pageWidth - 17, summaryY, { align: 'right' });
  summaryY += 5;
  pdf.text('Round Off:', pageWidth - 60, summaryY);
  pdf.text(`₹${formatIndianNumber(invoice.round_off)}`, pageWidth - 17, summaryY, { align: 'right' });
  summaryY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Grand Total:', pageWidth - 60, summaryY);
  pdf.text(`₹${formatIndianNumber(invoice.grand_total)}`, pageWidth - 17, summaryY, { align: 'right' });
  summaryY += 5;

  if (invoice.advance_paid && invoice.advance_paid > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('Advance Paid:', pageWidth - 60, summaryY);
    pdf.text(`₹${formatIndianNumber(invoice.advance_paid)}`, pageWidth - 17, summaryY, { align: 'right' });
    summaryY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Balance Due:', pageWidth - 60, summaryY);
    pdf.text(`₹${formatIndianNumber(invoice.balance_due || 0)}`, pageWidth - 17, summaryY, { align: 'right' });
    summaryY += 5;
  }

  yPos = Math.max(yPos, summaryY) + 8;

  // GST Summary
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('GST SUMMARY', 17, yPos);
  yPos += 5;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 6, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('HSN/SAC', 17, yPos + 4);
  pdf.text('Taxable', 50, yPos + 4, { align: 'right' });
  pdf.text('CGST%', 75, yPos + 4, { align: 'right' });
  pdf.text('CGST Amt', 95, yPos + 4, { align: 'right' });
  pdf.text('SGST%', 120, yPos + 4, { align: 'right' });
  pdf.text('SGST Amt', 140, yPos + 4, { align: 'right' });
  pdf.text('Total Tax', pageWidth - 17, yPos + 4, { align: 'right' });

  yPos += 6;
  const gstSummary = calculateGSTSummary(invoice.line_items);
  pdf.setFont('helvetica', 'normal');
  gstSummary.forEach((gst) => {
    pdf.text(gst.hsn, 17, yPos + 4);
    pdf.text(`₹${formatIndianNumber(gst.taxable)}`, 50, yPos + 4, { align: 'right' });
    pdf.text(`${gst.cgstRate}%`, 75, yPos + 4, { align: 'right' });
    pdf.text(`₹${formatIndianNumber(gst.cgstAmount)}`, 95, yPos + 4, { align: 'right' });
    pdf.text(`${gst.sgstRate}%`, 120, yPos + 4, { align: 'right' });
    pdf.text(`₹${formatIndianNumber(gst.sgstAmount)}`, 140, yPos + 4, { align: 'right' });
    pdf.text(`₹${formatIndianNumber(gst.totalTax)}`, pageWidth - 17, yPos + 4, { align: 'right' });
    yPos += 5;
  });

  // Terms & Conditions
  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('TERMS & CONDITIONS', 17, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('• Payment Terms: 100% before Dispatch.', 17, yPos);
  yPos += 4;
  pdf.text('• Invoice valid for 7 days from date of issue.', 17, yPos);
  yPos += 4;
  pdf.text('• Electrical / Civil / External Plumbing and Lifting of Materials — Customer scope.', 17, yPos);
  yPos += 4;
  pdf.text('• Prices are subject to change without notice.', 17, yPos);

  // Signature
  yPos += 10;
  pdf.text('For: TALWIN AQUARAY', pageWidth - 17, yPos, { align: 'right' });
  yPos += 15;
  pdf.line(pageWidth - 60, yPos, pageWidth - 17, yPos);
  yPos += 4;
  pdf.text('Authorized Signatory', pageWidth - 17, yPos, { align: 'right' });

  // Save PDF
  const fileName = `Invoice-${invoice.invoice_number}.pdf`;
  pdf.save(fileName);
}
