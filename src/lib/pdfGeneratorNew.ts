import jsPDF from 'jspdf';
import { calculateGSTSummary, numToWords, formatIndianNumber, type LineItem } from './invoiceUtils';

interface Invoice {
  id: string;
  invoice_number: number;
  invoice_date: string;
  place_of_supply: string;
  customer_name: string;
  customer_contact?: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  eway_bill_number?: string;
  terms_conditions?: string;
  line_items: LineItem[];
  taxable_amount: number;
  gst_total: number;
  sub_total: number;
  round_off: number;
  grand_total: number;
  advance_paid?: number;
  balance_due?: number;
}

const PAGE_H = 297;
const PAGE_MARGIN_BOTTOM = 15;
const USABLE_BOTTOM = PAGE_H - PAGE_MARGIN_BOTTOM;

export async function generateInvoicePDF(invoice: Invoice) {
  console.log('Generating PDF for invoice:', invoice.invoice_number);

  if (!invoice.line_items || invoice.line_items.length === 0) {
    console.error('No line items found in invoice!');
    alert('Error: No products found in this invoice. Please add products before generating PDF.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  const ensureSpace = (needed: number) => {
    if (yPos + needed > USABLE_BOTTOM) {
      pdf.addPage();
      yPos = 20;
    }
  };

  // Add company logo
  try {
    const response = await fetch('/talwin-logo.jpeg');
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    pdf.addImage(base64, 'JPEG', 15, 10, 28, 28);
  } catch (error) {
    console.warn('Could not load logo:', error);
  }

  // Company info
  const infoX = 48;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TALWIN AQUARAY', infoX, 17);

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Talwin AquaRay (formerly known as "Skanda Agencies")', infoX, 22);
  pdf.text('No 34, Ground Floor, Nyanappanhalli, 80 Feet Road,', infoX, 26.5);
  pdf.text('BDA Layout BTM 4th Stage, Bengaluru, Karnataka 560076', infoX, 31);
  pdf.text('Phone: 70224 58515  |  Email: info@talwin.in', infoX, 35.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GSTIN: 29AOQPB3325K1ZQ  |  State: 29-Karnataka', infoX, 40);

  // INVOICE title and details — right side
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 15, 17, { align: 'right' });

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice No: ${invoice.invoice_number}`, pageWidth - 15, 25, { align: 'right' });

  const formattedDate = new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  pdf.text(`Date: ${formattedDate}`, pageWidth - 15, 30, { align: 'right' });
  pdf.text(`Supply: ${invoice.place_of_supply}`, pageWidth - 15, 35, { align: 'right' });

  if (invoice.eway_bill_number) {
    pdf.text(`E-way Bill: ${invoice.eway_bill_number}`, pageWidth - 15, 40, { align: 'right' });
  }

  // Divider line below header
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.4);
  pdf.line(15, 44, pageWidth - 15, 44);

  // Customer details box
  yPos = 48;
  let boxHeight = 18;
  if (invoice.customer_gst_number) boxHeight += 5;
  if (invoice.customer_address || invoice.billing_address) boxHeight += 12;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, boxHeight, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(15, yPos, 15, yPos + boxHeight);

  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('INVOICE TO', 20, yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.text(invoice.customer_name, 20, yPos);
  yPos += 4;

  if (invoice.customer_contact) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Phone: ${invoice.customer_contact}`, 20, yPos);
    yPos += 4;
  }

  if (invoice.customer_gst_number) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`GSTIN: ${invoice.customer_gst_number}`, 20, yPos);
    pdf.setFont('helvetica', 'normal');
    yPos += 4;
  }

  if (invoice.customer_address) {
    pdf.setFontSize(7);
    const addressLines = pdf.splitTextToSize(invoice.customer_address, 85);
    addressLines.slice(0, 2).forEach((line: string) => {
      pdf.text(line, 20, yPos);
      yPos += 3;
    });
  }

  if (invoice.billing_address && invoice.billing_address !== invoice.customer_address) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Billing: ', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    const billingLines = pdf.splitTextToSize(invoice.billing_address, 80);
    billingLines.slice(0, 1).forEach((line: string) => {
      pdf.text(line, 35, yPos);
      yPos += 3;
    });
  }

  // LINE ITEMS TABLE
  yPos = 84;

  const cols = {
    num:    { x: 15,  w: 7  },
    item:   { x: 22,  w: 55 },
    hsn:    { x: 77,  w: 21 },
    mrp:    { x: 98,  w: 22 },
    qty:    { x: 120, w: 10 },
    unit:   { x: 130, w: 12 },
    price:  { x: 142, w: 20 },
    gst:    { x: 162, w: 12 },
    amount: { x: 174, w: 21 },
  };

  const lineH = 4.5;
  const cellPad = 2.5;
  const headerH = 8;

  const drawTableHeader = () => {
    pdf.setFillColor(45, 45, 45);
    Object.values(cols).forEach(col => {
      pdf.rect(col.x, yPos, col.w, headerH, 'F');
    });
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('#', cols.num.x + cols.num.w / 2, yPos + 5.2, { align: 'center' });
    pdf.text('Item Name', cols.item.x + cellPad, yPos + 5.2);
    pdf.text('HSN Code', cols.hsn.x + cellPad, yPos + 5.2);
    pdf.text('MRP', cols.mrp.x + cols.mrp.w - cellPad, yPos + 5.2, { align: 'right' });
    pdf.text('Qty', cols.qty.x + cols.qty.w - cellPad, yPos + 5.2, { align: 'right' });
    pdf.text('Unit', cols.unit.x + cellPad, yPos + 5.2);
    pdf.text('Unit Price', cols.price.x + cols.price.w - cellPad, yPos + 5.2, { align: 'right' });
    pdf.text('GST%', cols.gst.x + cols.gst.w - cellPad, yPos + 5.2, { align: 'right' });
    pdf.text('Amount', cols.amount.x + cols.amount.w - cellPad, yPos + 5.2, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    yPos += headerH;
  };

  const drawTableBorders = (rowY: number, rowH: number) => {
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    Object.values(cols).forEach(col => {
      pdf.rect(col.x, rowY, col.w, rowH);
    });
  };

  drawTableHeader();
  pdf.setFontSize(7.5);

  invoice.line_items.forEach((item, idx) => {
    pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(item.item_name, cols.item.w - cellPad * 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    const descLines = item.item_description
      ? pdf.splitTextToSize(item.item_description, cols.item.w - cellPad * 2)
      : [];
    pdf.setFontSize(7.5);

    const textLines = nameLines.length + (descLines.length > 0 ? descLines.length + 0.3 : 0);
    const rowH = Math.max(textLines * lineH + cellPad * 2, 10);

    if (yPos + rowH > USABLE_BOTTOM) {
      pdf.addPage();
      yPos = 20;
      drawTableHeader();
      pdf.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      Object.values(cols).forEach(col => {
        pdf.rect(col.x, yPos, col.w, rowH, 'F');
      });
    }

    drawTableBorders(yPos, rowH);

    const textTop = yPos + cellPad + 3.5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text((idx + 1).toString(), cols.num.x + cols.num.w / 2, textTop, { align: 'center' });

    nameLines.forEach((line: string, li: number) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text(line, cols.item.x + cellPad, textTop + li * lineH);
    });
    if (descLines.length > 0) {
      const descTop = textTop + nameLines.length * lineH + 0.5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      descLines.forEach((line: string, li: number) => {
        pdf.text(line, cols.item.x + cellPad, descTop + li * lineH);
      });
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(item.hsn_sac || '', cols.hsn.x + cellPad, textTop);
    pdf.text(item.mrp ? formatIndianNumber(item.mrp) : '—', cols.mrp.x + cols.mrp.w - cellPad, textTop, { align: 'right' });
    pdf.text(item.quantity.toString(), cols.qty.x + cols.qty.w - cellPad, textTop, { align: 'right' });
    pdf.text(item.unit.substring(0, 5), cols.unit.x + cellPad, textTop);
    pdf.text(formatIndianNumber(item.price_per_unit), cols.price.x + cols.price.w - cellPad, textTop, { align: 'right' });
    pdf.text(`${item.gst_rate}%`, cols.gst.x + cols.gst.w - cellPad, textTop, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatIndianNumber(item.total_amount), cols.amount.x + cols.amount.w - cellPad, textTop, { align: 'right' });
    pdf.setFont('helvetica', 'normal');

    yPos += rowH;
  });

  // Total quantity and subtotal row
  ensureSpace(12);
  yPos += 4;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('Total Qty:', cols.qty.x - 1, yPos + 5, { align: 'right' });
  pdf.text(
    invoice.line_items.reduce((sum, item) => sum + item.quantity, 0).toString(),
    cols.qty.x + cols.qty.w - 2,
    yPos + 5,
    { align: 'right' }
  );
  pdf.text('Sub Total:', cols.amount.x - 2, yPos + 5, { align: 'right' });
  pdf.text(formatIndianNumber(invoice.sub_total), cols.amount.x + cols.amount.w - 2, yPos + 5, { align: 'right' });
  yPos += 8;

  // Summary block (right) + amount in words (left)
  const hasAdvance = invoice.advance_paid && invoice.advance_paid > 0;
  const summaryLines = 3 + (hasAdvance ? 2 : 0);
  ensureSpace(summaryLines * 5 + 15);
  yPos += 4;

  const summaryYStart = yPos;
  let summaryY = summaryYStart;
  const summaryLabelX = pageWidth - 75;
  const summaryValueX = cols.amount.x + cols.amount.w - 2;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Sub Total:', summaryLabelX, summaryY);
  pdf.text(formatIndianNumber(invoice.sub_total), summaryValueX, summaryY, { align: 'right' });
  summaryY += 5;

  pdf.text('Round Off:', summaryLabelX, summaryY);
  pdf.text(formatIndianNumber(invoice.round_off), summaryValueX, summaryY, { align: 'right' });
  summaryY += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Grand Total:', summaryLabelX, summaryY);
  pdf.text(formatIndianNumber(invoice.grand_total), summaryValueX, summaryY, { align: 'right' });
  summaryY += 5;

  if (hasAdvance) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('Advance Paid:', summaryLabelX, summaryY);
    pdf.text(formatIndianNumber(invoice.advance_paid!), summaryValueX, summaryY, { align: 'right' });
    summaryY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Balance Due:', summaryLabelX, summaryY);
    pdf.text(formatIndianNumber(invoice.balance_due || 0), summaryValueX, summaryY, { align: 'right' });
    summaryY += 5;
  }

  // Amount in words (left side)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Amount in Words:', 17, summaryYStart);
  let wordsY = summaryYStart + 5;
  pdf.setFont('helvetica', 'italic');
  const words = numToWords(invoice.grand_total);
  const wordLines = pdf.splitTextToSize(words, 90);
  wordLines.forEach((line: string) => {
    pdf.text(line, 17, wordsY);
    wordsY += 4;
  });

  yPos = Math.max(wordsY, summaryY) + 4;

  // GST Summary Table
  const gstSummary = calculateGSTSummary(invoice.line_items);
  const gstBlockH = 6 + gstSummary.length * 5 + 10;
  ensureSpace(gstBlockH);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('GST SUMMARY', 17, yPos);
  yPos += 5;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 6, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);

  const gstColX = {
    hsn: 17,
    taxable: 60,
    cgstPct: 90,
    cgstAmt: 115,
    sgstPct: 140,
    sgstAmt: 165,
    total: pageWidth - 17
  };

  pdf.text('HSN/SAC', gstColX.hsn, yPos + 4);
  pdf.text('Taxable', gstColX.taxable, yPos + 4, { align: 'right' });
  pdf.text('CGST%', gstColX.cgstPct, yPos + 4, { align: 'right' });
  pdf.text('CGST Amt', gstColX.cgstAmt, yPos + 4, { align: 'right' });
  pdf.text('SGST%', gstColX.sgstPct, yPos + 4, { align: 'right' });
  pdf.text('SGST Amt', gstColX.sgstAmt, yPos + 4, { align: 'right' });
  pdf.text('Total Tax', gstColX.total, yPos + 4, { align: 'right' });
  yPos += 6;

  pdf.setFont('helvetica', 'normal');
  gstSummary.forEach((gst) => {
    pdf.text(gst.hsn, gstColX.hsn, yPos + 4);
    pdf.text(formatIndianNumber(gst.taxable), gstColX.taxable, yPos + 4, { align: 'right' });
    pdf.text(`${gst.cgstRate}%`, gstColX.cgstPct, yPos + 4, { align: 'right' });
    pdf.text(formatIndianNumber(gst.cgstAmount), gstColX.cgstAmt, yPos + 4, { align: 'right' });
    pdf.text(`${gst.sgstRate}%`, gstColX.sgstPct, yPos + 4, { align: 'right' });
    pdf.text(formatIndianNumber(gst.sgstAmount), gstColX.sgstAmt, yPos + 4, { align: 'right' });
    pdf.text(formatIndianNumber(gst.totalTax), gstColX.total, yPos + 4, { align: 'right' });
    yPos += 5;
  });

  // Terms & Conditions
  const defaultTerms = [
    '• Payment Terms: 100% before Dispatch.',
    '• Invoice valid for 7 days from date of issue.',
    '• Electrical / Civil / External Plumbing and Lifting of Materials — Customer scope.',
    '• All Sales Are Final. No Refunds or Exchanges.',
    '• All disputes are subject to Bengaluru jurisdiction.',
    '• Warranty: 1 Year warranty applicable as per Company Norms & Service at Authorized Service Center / As mentioned in warranty card.'
  ];

  const termsToRender = invoice.terms_conditions
    ? invoice.terms_conditions.split('\n').filter(t => t.trim())
    : defaultTerms;

  let termsHeight = 10;
  termsToRender.forEach(term => {
    const lines = pdf.splitTextToSize(term, pageWidth - 34);
    termsHeight += lines.length * 4;
  });

  ensureSpace(termsHeight + 35);

  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('TERMS & CONDITIONS', 17, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);

  termsToRender.forEach(term => {
    const termLines = pdf.splitTextToSize(term, pageWidth - 34);
    termLines.forEach((line: string) => {
      ensureSpace(5);
      pdf.text(line, 17, yPos);
      yPos += 4;
    });
  });

  // Signatory
  ensureSpace(25);
  yPos += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('For: TALWIN AQUARAY', pageWidth - 15, yPos, { align: 'right' });
  yPos += 15;
  pdf.text('Authorized Signatory', pageWidth - 15, yPos, { align: 'right' });

  pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
}
