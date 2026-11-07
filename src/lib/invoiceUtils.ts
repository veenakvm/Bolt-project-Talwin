export function toINR(n: number): string {
  return '₹' + Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function toINRn(n: number): string {
  return Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// PDF-safe Indian number formatting
export function formatIndianNumber(n: number): string {
  const num = Number(n || 0);
  const [intPart, decPart] = num.toFixed(2).split('.');

  // Indian numbering system: last 3 digits, then groups of 2
  let formatted = '';
  const len = intPart.length;

  if (len <= 3) {
    formatted = intPart;
  } else {
    // Last 3 digits
    formatted = intPart.slice(-3);
    let remaining = intPart.slice(0, -3);

    // Groups of 2 digits
    while (remaining.length > 0) {
      if (remaining.length <= 2) {
        formatted = remaining + ',' + formatted;
        remaining = '';
      } else {
        formatted = remaining.slice(-2) + ',' + formatted;
        remaining = remaining.slice(0, -2);
      }
    }
  }

  return formatted + '.' + decPart;
}

export function numToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertHundreds(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
  }

  let words = '';
  let x = Math.floor(amount);

  if (x >= 10000000) {
    words += convertHundreds(Math.floor(x / 10000000)) + ' Crore ';
    x %= 10000000;
  }
  if (x >= 100000) {
    words += convertHundreds(Math.floor(x / 100000)) + ' Lakh ';
    x %= 100000;
  }
  if (x >= 1000) {
    words += convertHundreds(Math.floor(x / 1000)) + ' Thousand ';
    x %= 1000;
  }
  if (x > 0) {
    words += convertHundreds(x);
  }

  return words.trim() + ' Rupees only';
}

export interface LineItem {
  id: string;
  item_name: string;
  item_description?: string;
  hsn_sac?: string;
  /** Legacy field from older invoices; no longer shown or entered. */
  mrp?: number;
  quantity: number;
  unit: string;
  price_per_unit: number;
  discount_percent?: number;
  /** Qty x price, less discount. GST is charged on this amount. */
  taxable_amount?: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
}

/** Taxable value of a line (after discount). Works for items saved before discounts existed. */
export function lineTaxable(item: LineItem): number {
  if (typeof item.taxable_amount === 'number') return item.taxable_amount;
  const discount = Number(item.discount_percent) || 0;
  return item.price_per_unit * item.quantity * (1 - discount / 100);
}

export function calculateLineItem(item: Partial<LineItem>): LineItem {
  const quantity = Number(item.quantity) || 1;
  const pricePerUnit = Number(item.price_per_unit) || 0;
  const discountPercent = Math.min(Math.max(Number(item.discount_percent) || 0, 0), 100);
  const gstRate = item.gst_rate !== undefined && item.gst_rate !== null ? Number(item.gst_rate) : 18;

  const taxableAmount = pricePerUnit * quantity * (1 - discountPercent / 100);
  const gstAmount = (taxableAmount * gstRate) / 100;
  const totalAmount = taxableAmount + gstAmount;

  return {
    id: item.id || crypto.randomUUID(),
    item_name: item.item_name || '',
    item_description: item.item_description || '',
    hsn_sac: item.hsn_sac || '',
    quantity,
    unit: item.unit || 'Pcs',
    price_per_unit: pricePerUnit,
    discount_percent: discountPercent,
    taxable_amount: taxableAmount,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total_amount: totalAmount
  };
}

export function emptyLineItem(): LineItem {
  return calculateLineItem({ quantity: 1, unit: 'Pcs', price_per_unit: 0, gst_rate: 18 });
}

export interface InvoiceTotals {
  taxableAmount: number;
  gstTotal: number;
  subTotal: number;
  roundOff: number;
  grandTotal: number;
}

export function calculateInvoiceTotals(items: LineItem[]): InvoiceTotals {
  const taxableAmount = items.reduce((sum, item) => sum + lineTaxable(item), 0);

  const gstTotal = items.reduce((sum, item) =>
    sum + item.gst_amount, 0
  );

  const subTotal = taxableAmount + gstTotal;
  const grandTotal = Math.round(subTotal);
  const roundOff = grandTotal - subTotal;

  return {
    taxableAmount,
    gstTotal,
    subTotal,
    roundOff,
    grandTotal
  };
}

export const CUSTOMER_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'M/s.', 'Dr.'];

/** "Mr." + "Ramesh" -> "Mr. Ramesh". Leaves the name alone if no title is set. */
export function formatCustomerName(title: string | null | undefined, name: string): string {
  return title ? `${title} ${name}` : name;
}

/** Returns an error message, or null if the customer's phone and address are filled in. */
export function validateCustomerContact(phone: string, address: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) return 'Enter a valid customer phone number (at least 10 digits)';
  if (!(address || '').trim()) return 'Enter the customer address';
  return null;
}

export interface GSTSummary {
  hsn: string;
  taxable: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalTax: number;
}

export function calculateGSTSummary(items: LineItem[]): GSTSummary[] {
  const gstMap: Record<string, GSTSummary> = {};

  items.forEach(item => {
    const key = item.hsn_sac || 'N/A';
    if (!gstMap[key]) {
      gstMap[key] = {
        hsn: key,
        taxable: 0,
        cgstRate: item.gst_rate / 2,
        cgstAmount: 0,
        sgstRate: item.gst_rate / 2,
        sgstAmount: 0,
        totalTax: 0
      };
    }

    const base = lineTaxable(item);
    gstMap[key].taxable += base;
    gstMap[key].cgstAmount += (base * item.gst_rate / 2) / 100;
    gstMap[key].sgstAmount += (base * item.gst_rate / 2) / 100;
    gstMap[key].totalTax += item.gst_amount;
  });

  return Object.values(gstMap);
}
