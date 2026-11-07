import jsPDF from 'jspdf';
import {
  calculateGSTSummary,
  numToWords,
  formatIndianNumber,
  formatCustomerName,
  lineTaxable,
  type LineItem
} from './invoiceUtils';

/** Everything the invoice and quotation PDFs have in common. */
export interface PdfDocumentData {
  title: 'INVOICE' | 'QUOTATION';
  numberLabel: string;          // e.g. "Invoice No" / "Quote No"
  number: string | number;
  date: string;                 // yyyy-mm-dd
  place_of_supply: string;
  eway_bill_number?: string;
  customerHeading: string;      // e.g. "INVOICE TO"
  customer_title?: string;
  customer_name: string;
  customer_contact?: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  line_items: LineItem[];
  sub_total: number;
  round_off: number;
  grand_total: number;
  advance_paid?: number;
  balance_due?: number;
  showBankDetails: boolean;
  fileName: string;
}

const PAGE_H = 297;
const USABLE_BOTTOM = PAGE_H - 15;
const LEFT = 15;

// Line-item columns, in mm. Total width = 180 (15mm margins on A4).
// Numeric columns are kept narrow; the item column gets the remaining space.
// GST is the last column, as requested.
const COLS = {
  num:     { x: 15,  w: 7  },
  item:    { x: 22,  w: 63 },
  hsn:     { x: 85,  w: 16 },
  qty:     { x: 101, w: 10 },
  unit:    { x: 111, w: 11 },
  rate:    { x: 122, w: 19 },
  disc:    { x: 141, w: 12 },
  taxable: { x: 153, w: 22 },
  gst:     { x: 175, w: 20 },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch('/talwin-logo.jpeg');
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not load logo:', error);
    return null;
  }
}

export async function generateDocumentPDF(doc: PdfDocumentData) {
  if (!doc.line_items || doc.line_items.length === 0) {
    alert('Error: No products found. Please add products before generating PDF.');
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const right = pageWidth - 15;
  let yPos = 20;

  const ensureSpace = (needed: number) => {
    if (yPos + needed > USABLE_BOTTOM) {
      pdf.addPage();
      yPos = 20;
    }
  };

  // ---- Header -------------------------------------------------------------
  const logo = await loadLogo();
  if (logo) pdf.addImage(logo, 'JPEG', LEFT, 10, 28, 28);

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

  pdf.setFontSize(20);
  pdf.text(doc.title, right, 17, { align: 'right' });

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${doc.numberLabel}: ${doc.number}`, right, 25, { align: 'right' });
  pdf.text(`Date: ${formatDate(doc.date)}`, right, 30, { align: 'right' });
  pdf.text(`Supply: ${doc.place_of_supply}`, right, 35, { align: 'right' });
  if (doc.eway_bill_number) {
    pdf.text(`E-way Bill: ${doc.eway_bill_number}`, right, 40, { align: 'right' });
  }

  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.4);
  pdf.line(LEFT, 44, right, 44);

  // ---- Customer box -------------------------------------------------------
  pdf.setFontSize(7);
  const addressLines: string[] = doc.customer_address
    ? pdf.splitTextToSize(doc.customer_address, 170).slice(0, 2)
    : [];
  const showBilling = !!doc.billing_address && doc.billing_address !== doc.customer_address;
  const billingLines: string[] = showBilling
    ? pdf.splitTextToSize(doc.billing_address!, 155).slice(0, 2)
    : [];

  yPos = 48;
  const boxHeight = 14
    + (doc.customer_contact ? 4 : 0)
    + (doc.customer_gst_number ? 4 : 0)
    + addressLines.length * 3.5
    + billingLines.length * 3.5;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(LEFT, yPos, pageWidth - 30, boxHeight, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(LEFT, yPos, LEFT, yPos + boxHeight);

  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(doc.customerHeading, 20, yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.text(formatCustomerName(doc.customer_title, doc.customer_name), 20, yPos);
  yPos += 4;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  if (doc.customer_contact) {
    pdf.text(`Phone: ${doc.customer_contact}`, 20, yPos);
    yPos += 4;
  }
  if (doc.customer_gst_number) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`GSTIN: ${doc.customer_gst_number}`, 20, yPos);
    pdf.setFont('helvetica', 'normal');
    yPos += 4;
  }
  pdf.setFontSize(7);
  addressLines.forEach((line) => {
    pdf.text(line, 20, yPos);
    yPos += 3.5;
  });
  if (billingLines.length) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Billing:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    billingLines.forEach((line) => {
      pdf.text(line, 32, yPos);
      yPos += 3.5;
    });
  }

  // ---- Line items table ---------------------------------------------------
  yPos = 48 + boxHeight + 6;

  const lineH = 3.8;
  const cellPad = 1.8;
  const headerH = 7;

  const drawTableHeader = () => {
    pdf.setFillColor(45, 45, 45);
    Object.values(COLS).forEach(col => pdf.rect(col.x, yPos, col.w, headerH, 'F'));
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    const ty = yPos + 4.6;
    pdf.text('#', COLS.num.x + COLS.num.w / 2, ty, { align: 'center' });
    pdf.text('Item & Description', COLS.item.x + cellPad, ty);
    pdf.text('HSN', COLS.hsn.x + cellPad, ty);
    pdf.text('Qty', COLS.qty.x + COLS.qty.w - cellPad, ty, { align: 'right' });
    pdf.text('Unit', COLS.unit.x + cellPad, ty);
    pdf.text('Rate', COLS.rate.x + COLS.rate.w - cellPad, ty, { align: 'right' });
    pdf.text('Disc%', COLS.disc.x + COLS.disc.w - cellPad, ty, { align: 'right' });
    pdf.text('Taxable', COLS.taxable.x + COLS.taxable.w - cellPad, ty, { align: 'right' });
    pdf.text('GST', COLS.gst.x + COLS.gst.w - cellPad, ty, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    yPos += headerH;
  };

  drawTableHeader();

  doc.line_items.forEach((item, idx) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    const nameLines: string[] = pdf.splitTextToSize(item.item_name || '', COLS.item.w - cellPad * 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    const descLines: string[] = item.item_description
      ? pdf.splitTextToSize(item.item_description, COLS.item.w - cellPad * 2)
      : [];

    const textLines = nameLines.length + descLines.length;
    // Leave room for the two-line GST cell (rate + amount).
    const rowH = Math.max(textLines * lineH + cellPad * 2, 2 * lineH + cellPad * 2);

    if (yPos + rowH > USABLE_BOTTOM) {
      pdf.addPage();
      yPos = 20;
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      Object.values(COLS).forEach(col => pdf.rect(col.x, yPos, col.w, rowH, 'F'));
    }
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    Object.values(COLS).forEach(col => pdf.rect(col.x, yPos, col.w, rowH));

    const textTop = yPos + cellPad + 2.8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(String(idx + 1), COLS.num.x + COLS.num.w / 2, textTop, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    nameLines.forEach((line, li) => pdf.text(line, COLS.item.x + cellPad, textTop + li * lineH));
    if (descLines.length) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      const descTop = textTop + nameLines.length * lineH;
      descLines.forEach((line, li) => pdf.text(line, COLS.item.x + cellPad, descTop + li * lineH));
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(item.hsn_sac || '', COLS.hsn.x + cellPad, textTop);
    pdf.text(String(item.quantity), COLS.qty.x + COLS.qty.w - cellPad, textTop, { align: 'right' });
    pdf.text((item.unit || '').substring(0, 5), COLS.unit.x + cellPad, textTop);
    pdf.text(formatIndianNumber(item.price_per_unit), COLS.rate.x + COLS.rate.w - cellPad, textTop, { align: 'right' });
    const disc = Number(item.discount_percent) || 0;
    pdf.text(disc ? `${disc}%` : '-', COLS.disc.x + COLS.disc.w - cellPad, textTop, { align: 'right' });
    pdf.text(formatIndianNumber(lineTaxable(item)), COLS.taxable.x + COLS.taxable.w - cellPad, textTop, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.text(formatIndianNumber(item.gst_amount), COLS.gst.x + COLS.gst.w - cellPad, textTop, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(`@ ${item.gst_rate}%`, COLS.gst.x + COLS.gst.w - cellPad, textTop + lineH, { align: 'right' });

    yPos += rowH;
  });

  // Totals row under the table
  const taxableTotal = doc.line_items.reduce((s, i) => s + lineTaxable(i), 0);
  const gstTotal = doc.line_items.reduce((s, i) => s + i.gst_amount, 0);
  ensureSpace(10);
  pdf.setFillColor(235, 235, 235);
  pdf.rect(LEFT, yPos, pageWidth - 30, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  const totY = yPos + 4.6;
  pdf.text('Total', COLS.item.x + cellPad, totY);
  pdf.text(
    String(doc.line_items.reduce((sum, item) => sum + item.quantity, 0)),
    COLS.qty.x + COLS.qty.w - cellPad, totY, { align: 'right' }
  );
  pdf.text(formatIndianNumber(taxableTotal), COLS.taxable.x + COLS.taxable.w - cellPad, totY, { align: 'right' });
  pdf.text(formatIndianNumber(gstTotal), COLS.gst.x + COLS.gst.w - cellPad, totY, { align: 'right' });
  yPos += 7;

  // ---- Summary (right) + amount in words (left) ---------------------------
  const hasAdvance = !!doc.advance_paid && doc.advance_paid > 0;
  ensureSpace((5 + (hasAdvance ? 2 : 0)) * 5 + 10);
  yPos += 6;

  const summaryYStart = yPos;
  let summaryY = summaryYStart;
  const labelX = pageWidth - 75;

  const summaryRow = (label: string, value: number, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(9);
    pdf.text(label, labelX, summaryY);
    pdf.text(formatIndianNumber(value), right - cellPad, summaryY, { align: 'right' });
    summaryY += 5;
  };

  summaryRow('Taxable Amount:', taxableTotal);
  summaryRow('Total GST:', gstTotal);
  summaryRow('Sub Total:', doc.sub_total);
  summaryRow('Round Off:', doc.round_off);
  summaryRow('Grand Total:', doc.grand_total, true);
  if (hasAdvance) {
    summaryRow('Advance Paid:', doc.advance_paid!);
    summaryRow('Balance Due:', doc.balance_due || 0, true);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Amount in Words:', 17, summaryYStart);
  let wordsY = summaryYStart + 5;
  pdf.setFont('helvetica', 'italic');
  (pdf.splitTextToSize(numToWords(doc.grand_total), 95) as string[]).forEach((line) => {
    pdf.text(line, 17, wordsY);
    wordsY += 4;
  });

  yPos = Math.max(wordsY, summaryY) + 4;

  // ---- GST summary --------------------------------------------------------
  const gstSummary = calculateGSTSummary(doc.line_items);
  ensureSpace(6 + gstSummary.length * 5 + 10);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('GST SUMMARY', 17, yPos);
  yPos += 3;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(LEFT, yPos, pageWidth - 30, 6, 'F');
  pdf.setFontSize(7);

  const g = { hsn: 17, taxable: 60, cgstPct: 85, cgstAmt: 110, sgstPct: 135, sgstAmt: 160, total: right - 2 };
  pdf.text('HSN/SAC', g.hsn, yPos + 4);
  pdf.text('Taxable', g.taxable, yPos + 4, { align: 'right' });
  pdf.text('CGST%', g.cgstPct, yPos + 4, { align: 'right' });
  pdf.text('CGST Amt', g.cgstAmt, yPos + 4, { align: 'right' });
  pdf.text('SGST%', g.sgstPct, yPos + 4, { align: 'right' });
  pdf.text('SGST Amt', g.sgstAmt, yPos + 4, { align: 'right' });
  pdf.text('Total Tax', g.total, yPos + 4, { align: 'right' });
  yPos += 6;

  pdf.setFont('helvetica', 'normal');
  gstSummary.forEach((row) => {
    pdf.text(row.hsn, g.hsn, yPos + 4);
    pdf.text(formatIndianNumber(row.taxable), g.taxable, yPos + 4, { align: 'right' });
    pdf.text(`${row.cgstRate}%`, g.cgstPct, yPos + 4, { align: 'right' });
    pdf.text(formatIndianNumber(row.cgstAmount), g.cgstAmt, yPos + 4, { align: 'right' });
    pdf.text(`${row.sgstRate}%`, g.sgstPct, yPos + 4, { align: 'right' });
    pdf.text(formatIndianNumber(row.sgstAmount), g.sgstAmt, yPos + 4, { align: 'right' });
    pdf.text(formatIndianNumber(row.totalTax), g.total, yPos + 4, { align: 'right' });
    yPos += 5;
  });

  // ---- Bank details -------------------------------------------------------
  if (doc.showBankDetails) {
    ensureSpace(25);
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('BANK DETAILS', 17, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Name: BANK OF BARODA', 17, yPos); yPos += 4;
    pdf.text('Account No.: 89630200001898', 17, yPos); yPos += 4;
    pdf.text('IFSC Code: BARB0VJMUSU', 17, yPos); yPos += 4;
    pdf.text('Account Holder: TALWIN AQUARAY', 17, yPos);
  }

  // ---- Terms & conditions: blank space to fill in by hand -----------------
  const termsBoxH = 32;
  ensureSpace(termsBoxH + 35);
  yPos += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('TERMS & CONDITIONS', 17, yPos);
  yPos += 2;
  pdf.setDrawColor(160, 160, 160);
  pdf.setLineWidth(0.3);
  pdf.rect(LEFT, yPos, pageWidth - 30, termsBoxH);
  pdf.setDrawColor(215, 215, 215);
  for (let ly = yPos + 7; ly < yPos + termsBoxH - 2; ly += 6) {
    pdf.line(LEFT + 3, ly, right - 3, ly);
  }
  yPos += termsBoxH;

  // ---- Signatory ----------------------------------------------------------
  yPos += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('For: TALWIN AQUARAY', right, yPos, { align: 'right' });
  yPos += 15;
  pdf.text('Authorized Signatory', right, yPos, { align: 'right' });

  pdf.save(doc.fileName);
}
