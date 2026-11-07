import { generateDocumentPDF } from './documentPdf';
import type { LineItem } from './invoiceUtils';

interface Invoice {
  invoice_number: number;
  invoice_date: string;
  place_of_supply: string;
  customer_title?: string;
  customer_name: string;
  customer_contact?: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  eway_bill_number?: string;
  line_items?: LineItem[];
  sub_total: number;
  round_off: number;
  grand_total: number;
  advance_paid?: number;
  balance_due?: number;
}

export async function generateInvoicePDF(invoice: Invoice) {
  await generateDocumentPDF({
    title: 'INVOICE',
    numberLabel: 'Invoice No',
    number: invoice.invoice_number,
    date: invoice.invoice_date,
    place_of_supply: invoice.place_of_supply,
    eway_bill_number: invoice.eway_bill_number,
    customerHeading: 'INVOICE TO',
    customer_title: invoice.customer_title,
    customer_name: invoice.customer_name,
    customer_contact: invoice.customer_contact,
    customer_gst_number: invoice.customer_gst_number,
    customer_address: invoice.customer_address,
    billing_address: invoice.billing_address,
    line_items: invoice.line_items || [],
    sub_total: invoice.sub_total,
    round_off: invoice.round_off,
    grand_total: invoice.grand_total,
    advance_paid: invoice.advance_paid,
    balance_due: invoice.balance_due,
    showBankDetails: false,
    fileName: `Invoice-${invoice.invoice_number}.pdf`
  });
}
