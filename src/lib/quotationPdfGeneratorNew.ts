import { generateDocumentPDF } from './documentPdf';
import type { LineItem } from './invoiceUtils';

interface Quotation {
  estimate_number: string;
  date: string;
  place_of_supply: string;
  customer_title?: string;
  customer_name: string;
  customer_contact?: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  line_items?: LineItem[];
  sub_total: number;
  round_off: number;
  grand_total: number;
}

export async function generateQuotationPDF(quotation: Quotation) {
  await generateDocumentPDF({
    title: 'QUOTATION',
    numberLabel: 'Quote No',
    number: quotation.estimate_number,
    date: quotation.date,
    place_of_supply: quotation.place_of_supply,
    customerHeading: 'QUOTATION FOR',
    customer_title: quotation.customer_title,
    customer_name: quotation.customer_name,
    customer_contact: quotation.customer_contact,
    customer_gst_number: quotation.customer_gst_number,
    customer_address: quotation.customer_address,
    billing_address: quotation.billing_address,
    line_items: quotation.line_items || [],
    sub_total: quotation.sub_total,
    round_off: quotation.round_off,
    grand_total: quotation.grand_total,
    showBankDetails: true,
    fileName: `Quotation-${quotation.estimate_number}.pdf`
  });
}
