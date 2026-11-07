import jsPDF from 'jspdf';

function fmt(n: number) {
  return '\u20B9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addHeader(pdf: jsPDF, title: string, subtitle: string, pageWidth: number): number {
  pdf.setFillColor(30, 58, 138);
  pdf.rect(0, 0, pageWidth, 22, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('TALWIN AQUARAY', 15, 10);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(title, 15, 17);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(subtitle, pageWidth - 15, 10, { align: 'right' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 15, 17, { align: 'right' });
  pdf.setTextColor(0, 0, 0);
  return 28;
}

function addKpiRow(pdf: jsPDF, kpis: { label: string; value: string }[], yPos: number, pageWidth: number): number {
  const colW = (pageWidth - 30) / kpis.length;
  kpis.forEach((k, i) => {
    const x = 15 + i * colW;
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(x, yPos, colW - 4, 18, 2, 2, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.label, x + (colW - 4) / 2, yPos + 6, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(k.value, x + (colW - 4) / 2, yPos + 14, { align: 'center' });
  });
  pdf.setTextColor(0, 0, 0);
  return yPos + 24;
}

function tableHeader(pdf: jsPDF, cols: { label: string; x: number; align?: 'left' | 'right' | 'center' }[], yPos: number, pageWidth: number): number {
  pdf.setFillColor(30, 58, 138);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  cols.forEach(c => {
    pdf.text(c.label, c.x, yPos + 5.5, { align: c.align || 'left' });
  });
  pdf.setTextColor(0, 0, 0);
  return yPos + 8;
}

function checkPageBreak(pdf: jsPDF, yPos: number, rowH: number, pageHeight: number, pageWidth: number, cols: { label: string; x: number; align?: 'left' | 'right' | 'center' }[]): number {
  if (yPos + rowH > pageHeight - 15) {
    pdf.addPage();
    yPos = addHeader(pdf, '', 'CONTINUED', pageWidth);
    yPos = tableHeader(pdf, cols, yPos, pageWidth);
  }
  return yPos;
}

export function generateExpenseReportPDF(
  expenses: { date: string; category: string; description: string; amount: number; payment_mode: string; remarks: string }[],
  totalExpenses: number,
  period: string
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = addHeader(pdf, `Expense Report — ${period}`, 'EXPENSE REPORT', pageWidth);

  const kpis = [
    { label: 'Total Expenses', value: fmt(totalExpenses) },
    { label: 'Total Entries', value: String(expenses.length) },
    { label: 'Avg per Entry', value: expenses.length ? fmt(totalExpenses / expenses.length) : '₹0.00' },
  ];
  yPos = addKpiRow(pdf, kpis, yPos, pageWidth);

  const cols = [
    { label: '#', x: 17 },
    { label: 'Date', x: 24 },
    { label: 'Category', x: 50 },
    { label: 'Description', x: 90 },
    { label: 'Payment Mode', x: 148 },
    { label: 'Amount', x: pageWidth - 17, align: 'right' as const },
  ];
  yPos = tableHeader(pdf, cols, yPos, pageWidth);

  const rowH = 7;
  let rowBg = false;
  expenses.forEach((e, idx) => {
    yPos = checkPageBreak(pdf, yPos, rowH, pageHeight, pageWidth, cols);
    if (rowBg) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(15, yPos, pageWidth - 30, rowH, 'F');
    }
    rowBg = !rowBg;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(String(idx + 1), 17, yPos + 4.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(new Date(e.date).toLocaleDateString('en-IN'), 24, yPos + 4.5);
    pdf.text(e.category || '', 50, yPos + 4.5);
    const desc = pdf.splitTextToSize(e.description || '', 55);
    pdf.text(desc[0] || '', 90, yPos + 4.5);
    pdf.text(e.payment_mode || '', 148, yPos + 4.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(e.amount), pageWidth - 17, yPos + 4.5, { align: 'right' });
    yPos += rowH;
  });

  pdf.setFillColor(254, 243, 199);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(120, 53, 15);
  pdf.text('TOTAL', pageWidth - 70, yPos + 5.5);
  pdf.text(fmt(totalExpenses), pageWidth - 17, yPos + 5.5, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  pdf.save(`Expense_Report_${period.replace(/\s/g, '_')}.pdf`);
}

export function generateQuotationReportPDF(
  quotations: { estimate_number: string; date: string; customer_name: string; place_of_supply: string; sub_total: number; grand_total: number }[],
  totalValue: number,
  period: string
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = addHeader(pdf, `Quotation Report — ${period}`, 'QUOTATION REPORT', pageWidth);

  const kpis = [
    { label: 'Total Quotations', value: String(quotations.length) },
    { label: 'Total Value', value: fmt(totalValue) },
    { label: 'Avg Value', value: quotations.length ? fmt(totalValue / quotations.length) : '₹0.00' },
  ];
  yPos = addKpiRow(pdf, kpis, yPos, pageWidth);

  const cols = [
    { label: '#', x: 17 },
    { label: 'Quote No.', x: 24 },
    { label: 'Date', x: 55 },
    { label: 'Customer', x: 88 },
    { label: 'Place of Supply', x: 140 },
    { label: 'Sub Total', x: pageWidth - 32, align: 'right' as const },
    { label: 'Grand Total', x: pageWidth - 17, align: 'right' as const },
  ];
  yPos = tableHeader(pdf, cols, yPos, pageWidth);

  const rowH = 7;
  let rowBg = false;
  quotations.forEach((q, idx) => {
    yPos = checkPageBreak(pdf, yPos, rowH, pageHeight, pageWidth, cols);
    if (rowBg) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(15, yPos, pageWidth - 30, rowH, 'F');
    }
    rowBg = !rowBg;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(String(idx + 1), 17, yPos + 4.5);
    pdf.setTextColor(30, 86, 160);
    pdf.text(q.estimate_number || '', 24, yPos + 4.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(q.date ? new Date(q.date).toLocaleDateString('en-IN') : '—', 55, yPos + 4.5);
    pdf.text(q.customer_name || '', 88, yPos + 4.5);
    pdf.text(q.place_of_supply || '', 140, yPos + 4.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(fmt(q.sub_total), pageWidth - 32, yPos + 4.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(fmt(q.grand_total), pageWidth - 17, yPos + 4.5, { align: 'right' });
    yPos += rowH;
  });

  pdf.setFillColor(219, 234, 254);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(29, 78, 216);
  pdf.text('TOTAL', pageWidth - 60, yPos + 5.5);
  pdf.text(fmt(totalValue), pageWidth - 17, yPos + 5.5, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  pdf.save(`Quotation_Report_${period.replace(/\s/g, '_')}.pdf`);
}

export function generateInvoiceReportPDF(
  invoices: { invoice_number: number; invoice_date: string; customer_name: string; place_of_supply: string; grand_total: number; advance_paid: number; balance_due: number }[],
  totalValue: number,
  totalAdvance: number,
  totalBalance: number,
  period: string
) {
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = addHeader(pdf, `Invoice Report — ${period}`, 'INVOICE REPORT', pageWidth);

  const kpis = [
    { label: 'Total Invoices', value: String(invoices.length) },
    { label: 'Total Value', value: fmt(totalValue) },
    { label: 'Advance Collected', value: fmt(totalAdvance) },
    { label: 'Balance Due', value: fmt(totalBalance) },
  ];
  yPos = addKpiRow(pdf, kpis, yPos, pageWidth);

  const cols = [
    { label: '#', x: 17 },
    { label: 'Invoice No.', x: 24 },
    { label: 'Date', x: 58 },
    { label: 'Customer', x: 95 },
    { label: 'Place of Supply', x: 165 },
    { label: 'Grand Total', x: pageWidth - 52, align: 'right' as const },
    { label: 'Advance', x: pageWidth - 30, align: 'right' as const },
    { label: 'Balance Due', x: pageWidth - 17, align: 'right' as const },
  ];
  yPos = tableHeader(pdf, cols, yPos, pageWidth);

  const rowH = 7;
  let rowBg = false;
  invoices.forEach((inv, idx) => {
    yPos = checkPageBreak(pdf, yPos, rowH, pageHeight, pageWidth, cols);
    if (rowBg) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(15, yPos, pageWidth - 30, rowH, 'F');
    }
    rowBg = !rowBg;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(String(idx + 1), 17, yPos + 4.5);
    pdf.setTextColor(21, 128, 61);
    pdf.text(`#${inv.invoice_number}`, 24, yPos + 4.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—', 58, yPos + 4.5);
    pdf.text(inv.customer_name || '', 95, yPos + 4.5);
    pdf.text(inv.place_of_supply || '', 165, yPos + 4.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(inv.grand_total), pageWidth - 52, yPos + 4.5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(37, 99, 235);
    pdf.text(inv.advance_paid ? fmt(inv.advance_paid) : '—', pageWidth - 30, yPos + 4.5, { align: 'right' });
    pdf.setTextColor((inv.balance_due || 0) > 0 ? 220 : 21, (inv.balance_due || 0) > 0 ? 38 : 128, (inv.balance_due || 0) > 0 ? 38 : 61);
    pdf.text((inv.balance_due || 0) > 0 ? fmt(inv.balance_due) : 'Paid', pageWidth - 17, yPos + 4.5, { align: 'right' });
    yPos += rowH;
  });

  pdf.setFillColor(220, 252, 231);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(21, 128, 61);
  pdf.text('TOTAL', 160, yPos + 5.5);
  pdf.text(fmt(totalValue), pageWidth - 52, yPos + 5.5, { align: 'right' });
  pdf.setTextColor(37, 99, 235);
  pdf.text(fmt(totalAdvance), pageWidth - 30, yPos + 5.5, { align: 'right' });
  pdf.setTextColor(185, 28, 28);
  pdf.text(fmt(totalBalance), pageWidth - 17, yPos + 5.5, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  pdf.save(`Invoice_Report_${period.replace(/\s/g, '_')}.pdf`);
}
