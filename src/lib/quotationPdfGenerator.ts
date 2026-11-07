import jsPDF from 'jspdf';
import { LineItem, calculateGSTSummary, numToWords, formatIndianNumber } from './invoiceUtils';

interface Quotation {
  estimate_number: string;
  date: string;
  place_of_supply: string;
  customer_name: string;
  contact_number: string;
  sub_total: number;
  round_off: number;
  grand_total: number;
  line_items?: LineItem[];
}

export async function generateQuotationPDF(quotation: Quotation) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

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

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QUOTATION', pageWidth - 15, 20, { align: 'right' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Quote No: ${quotation.estimate_number}`, pageWidth - 15, 32, { align: 'right' });
  pdf.text(`Date: ${quotation.date}`, pageWidth - 15, 37, { align: 'right' });
  pdf.text(`Supply: ${quotation.place_of_supply}`, pageWidth - 15, 42, { align: 'right' });

  yPos = 50;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 18, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(15, yPos, 15, yPos + 18);

  yPos += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('QUOTATION FOR', 20, yPos);
  yPos += 5;
  pdf.setFontSize(10);
  pdf.text(quotation.customer_name, 20, yPos);
  if (quotation.contact_number) {
    yPos += 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`📞 ${quotation.contact_number}`, 20, yPos);
  }

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

  yPos += 8;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  quotation.line_items?.forEach((item, index) => {
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

  yPos += 4;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Qty:', 115, yPos + 5, { align: 'right' });
  pdf.text(
    quotation.line_items?.reduce((sum, item) => sum + item.quantity, 0).toString() || '0',
    125,
    yPos + 5,
    { align: 'right' }
  );
  pdf.text('Sub Total:', 155, yPos + 5, { align: 'right' });
  pdf.text(`₹${formatIndianNumber(quotation.sub_total)}`, pageWidth - 17, yPos + 5, { align: 'right' });

  yPos += 12;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Amount in Words:', 17, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'italic');
  const words = numToWords(quotation.grand_total);
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
  pdf.text(`₹${formatIndianNumber(quotation.sub_total)}`, pageWidth - 17, summaryY, { align: 'right' });
  summaryY += 5;
  pdf.text('Round Off:', pageWidth - 60, summaryY);
  pdf.text(`₹${formatIndianNumber(quotation.round_off)}`, pageWidth - 17, summaryY, { align: 'right' });
  summaryY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Total:', pageWidth - 60, summaryY);
  pdf.text(`₹${formatIndianNumber(quotation.grand_total)}`, pageWidth - 17, summaryY, { align: 'right' });

  yPos = Math.max(yPos, summaryY) + 8;

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
  const gstSummary = calculateGSTSummary(quotation.line_items || []);
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

  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('BANK DETAILS', 17, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Name: BANK OF BARODA', 17, yPos);
  yPos += 4;
  pdf.text('Account No.: 89630200001898', 17, yPos);
  yPos += 4;
  pdf.text('IFSC Code: BARB0VJMUSU', 17, yPos);
  yPos += 4;
  pdf.text('Account Holder: TALWIN AQUARAY', 17, yPos);

  yPos += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('TERMS & CONDITIONS', 17, yPos);
  yPos += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('• Payment Terms: 100% before Dispatch.', 17, yPos);
  yPos += 4;
  pdf.text('• Quotation valid for 7 days from date of issue.', 17, yPos);
  yPos += 4;
  pdf.text('• Electrical / Civil / External Plumbing and Lifting of Materials — Customer scope.', 17, yPos);
  yPos += 4;
  pdf.text('• Prices are subject to change without notice.', 17, yPos);

  yPos += 10;
  pdf.text('For: TALWIN AQUARAY', pageWidth - 17, yPos, { align: 'right' });
  yPos += 15;
  pdf.line(pageWidth - 60, yPos, pageWidth - 17, yPos);
  yPos += 4;
  pdf.text('Authorized Signatory', pageWidth - 17, yPos, { align: 'right' });

  pdf.save(`Quotation-${quotation.estimate_number}.pdf`);
}
