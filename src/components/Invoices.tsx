import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, FileText, Printer, Pencil as Edit2, Trash2, X, Download } from 'lucide-react';
import {
  toINR, numToWords, calculateInvoiceTotals, calculateGSTSummary, emptyLineItem,
  CUSTOMER_TITLES, formatCustomerName, validateCustomerContact, type LineItem
} from '../lib/invoiceUtils';
import { generateInvoicePDF } from '../lib/pdfGeneratorNew';
import LineItemsEditor, { type CatalogProduct } from './shared/LineItemsEditor';
import LineItemsPreview from './shared/LineItemsPreview';

interface Invoice {
  id: string;
  invoice_number: number;
  invoice_date: string;
  place_of_supply: string;
  pipeline_source: string;
  customer_title?: string;
  customer_name: string;
  customer_contact: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  eway_bill_number?: string;
  terms_conditions?: string;
  taxable_amount: number;
  gst_total: number;
  sub_total: number;
  round_off: number;
  grand_total: number;
  advance_paid: number;
  balance_due: number;
  created_at: string;
  line_items?: LineItem[];
}

interface PipelineCustomer {
  id: string;
  customer_name: string;
  phone_number: string;
  pipeline_source: string;
}

/** A quotation being converted into an invoice (passed in from the Quotations screen). */
export interface QuotationForInvoice {
  id: string;
  estimate_number: string;
  place_of_supply: string;
  pipeline_source: string;
  customer_title?: string;
  customer_name: string;
  contact_number: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  line_items?: LineItem[];
}

interface InvoicesProps {
  fromQuotation?: QuotationForInvoice | null;
  onQuotationHandled?: () => void;
}

export default function Invoices({ fromQuotation, onQuotationHandled }: InvoicesProps = {}) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [customers, setCustomers] = useState<PipelineCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    place_of_supply: '29-Karnataka',
    pipeline_source: 'Sales',
    customer_title: '',
    customer_name: '',
    customer_contact: '',
    customer_gst_number: '',
    customer_address: '',
    billing_address: '',
    eway_bill_number: '',
    advance_paid: 0
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  // Quotation this invoice is being created from, if any.
  const [sourceQuotationId, setSourceQuotationId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
    fetchCustomers();
  }, []);

  // Open a pre-filled invoice form when a quotation is converted.
  useEffect(() => {
    if (!fromQuotation) return;
    setEditingId(null);
    setViewInvoice(null);
    setSelectedCustomerId('');
    setSourceQuotationId(fromQuotation.id);
    setFormData({
      invoice_date: new Date().toISOString().split('T')[0],
      place_of_supply: fromQuotation.place_of_supply || '29-Karnataka',
      pipeline_source: fromQuotation.pipeline_source || 'Sales',
      customer_title: fromQuotation.customer_title || '',
      customer_name: fromQuotation.customer_name,
      customer_contact: fromQuotation.contact_number || '',
      customer_gst_number: fromQuotation.customer_gst_number || '',
      customer_address: fromQuotation.customer_address || '',
      billing_address: fromQuotation.billing_address || '',
      eway_bill_number: '',
      advance_paid: 0
    });
    setLineItems(
      fromQuotation.line_items && fromQuotation.line_items.length
        ? fromQuotation.line_items.map(item => ({ ...item, id: crypto.randomUUID() }))
        : [emptyLineItem()]
    );
    setShowForm(true);
    onQuotationHandled?.();
  }, [fromQuotation]);

  const fetchInvoices = async () => {
    try {
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_number', { ascending: false });

      if (error) throw error;

      // line_items is stored as JSONB in the invoices table
      const invoicesWithItems = (invoicesData || []).map(invoice => ({
        ...invoice,
        line_items: Array.isArray(invoice.line_items) ? invoice.line_items : []
      }));

      setInvoices(invoicesWithItems);
    } catch (error: any) {
      console.error('Error fetching invoices:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const allCustomers: PipelineCustomer[] = [];

      const { data: salesData } = await supabase
        .from('sales_pipeline')
        .select('id, customer_name, phone_number')
        .not('customer_name', 'is', null);

      if (salesData) {
        allCustomers.push(...salesData.map(c => ({ ...c, pipeline_source: 'Sales' })));
      }

      const { data: installData } = await supabase
        .from('installation_pipeline')
        .select('id, customer_name, phone_number')
        .not('customer_name', 'is', null);

      if (installData) {
        allCustomers.push(...installData.map(c => ({ ...c, pipeline_source: 'Installation' })));
      }

      const { data: complaintData } = await supabase
        .from('complaint_pipeline')
        .select('id, customer_name, phone_number')
        .not('customer_name', 'is', null);

      if (complaintData) {
        allCustomers.push(...complaintData.map(c => ({ ...c, pipeline_source: 'Service' })));
      }

      allCustomers.sort((a, b) => a.customer_name.localeCompare(b.customer_name));

      setCustomers(allCustomers);
    } catch (error: any) {
      console.error('Error fetching customers:', error.message);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_name: customer.customer_name,
        customer_contact: customer.phone_number || '',
        pipeline_source: customer.pipeline_source
      });
    } else {
      setFormData({
        ...formData,
        customer_name: '',
        customer_contact: '',
        pipeline_source: 'Sales'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 SUBMITTING INVOICE');
    console.log('📦 Line Items State:', lineItems);
    console.log('📊 Line Items Count:', lineItems.length);

    if (!formData.customer_name.trim()) {
      alert('Enter customer name');
      return;
    }

    const contactError = validateCustomerContact(formData.customer_contact, formData.customer_address);
    if (contactError) {
      alert(contactError);
      return;
    }

    if (!lineItems.some(item => item.item_name && item.price_per_unit > 0)) {
      alert('Add at least one item with a price');
      return;
    }

    const totals = calculateInvoiceTotals(lineItems);
    const advancePaid = formData.advance_paid || 0;
    const balanceDue = totals.grandTotal - advancePaid;

    console.log('💰 Calculated Totals:', totals);
    console.log('📝 Line Items to Save:', JSON.stringify(lineItems, null, 2));

    try {
      let invoiceNumber: number;

      if (editingId) {
        const existing = invoices.find(inv => inv.id === editingId);
        invoiceNumber = existing!.invoice_number;

        console.log('✏️ UPDATING invoice', editingId);
        console.log('📤 Sending line_items:', lineItems);

        const { error: invError } = await supabase
          .from('invoices')
          .update({
            invoice_date: formData.invoice_date,
            place_of_supply: formData.place_of_supply,
            pipeline_source: formData.pipeline_source,
            customer_title: formData.customer_title,
            customer_name: formData.customer_name,
            customer_contact: formData.customer_contact,
            customer_gst_number: formData.customer_gst_number,
            customer_address: formData.customer_address,
            billing_address: formData.billing_address,
            eway_bill_number: formData.eway_bill_number,
            line_items: lineItems,
            taxable_amount: totals.taxableAmount,
            gst_total: totals.gstTotal,
            sub_total: totals.subTotal,
            round_off: totals.roundOff,
            grand_total: totals.grandTotal,
            advance_paid: advancePaid,
            balance_due: balanceDue,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (invError) throw invError;
        console.log('✅ Invoice updated successfully');
      } else {
        const { data: seqData } = await supabase.rpc('get_next_invoice_number');

        invoiceNumber = seqData || 100;

        console.log('➕ CREATING new invoice', invoiceNumber);
        console.log('📤 Sending line_items:', lineItems);

        const { data: created, error: invError } = await supabase
          .from('invoices')
          .insert([{
            user_id: user?.id,
            invoice_number: invoiceNumber,
            invoice_date: formData.invoice_date,
            place_of_supply: formData.place_of_supply,
            pipeline_source: formData.pipeline_source,
            customer_title: formData.customer_title,
            customer_name: formData.customer_name,
            customer_contact: formData.customer_contact,
            customer_gst_number: formData.customer_gst_number,
            customer_address: formData.customer_address,
            billing_address: formData.billing_address,
            eway_bill_number: formData.eway_bill_number,
            line_items: lineItems,
            taxable_amount: totals.taxableAmount,
            gst_total: totals.gstTotal,
            sub_total: totals.subTotal,
            round_off: totals.roundOff,
            grand_total: totals.grandTotal,
            advance_paid: advancePaid,
            balance_due: balanceDue
          }])
          .select()
          .single();

        if (invError) throw invError;
        console.log('✅ Invoice created successfully');

        if (sourceQuotationId && created) {
          const { error: linkError } = await supabase
            .from('quotations')
            .update({ converted_invoice_id: created.id })
            .eq('id', sourceQuotationId);
          if (linkError) console.error('Could not mark quotation as converted:', linkError.message);
        }
      }

      resetForm();
      fetchInvoices();
      alert('Invoice saved successfully!');
    } catch (error: any) {
      console.error('Error saving invoice:', error.message);
      alert('Error saving invoice: ' + error.message);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    const customer = customers.find(
      c => c.customer_name === invoice.customer_name && c.pipeline_source === invoice.pipeline_source
    );
    setSelectedCustomerId(customer?.id || '');
    setFormData({
      invoice_date: invoice.invoice_date,
      place_of_supply: invoice.place_of_supply,
      pipeline_source: invoice.pipeline_source,
      customer_title: invoice.customer_title || '',
      customer_name: invoice.customer_name,
      customer_contact: invoice.customer_contact,
      customer_gst_number: invoice.customer_gst_number || '',
      customer_address: invoice.customer_address || '',
      billing_address: invoice.billing_address || '',
      eway_bill_number: invoice.eway_bill_number || '',
      advance_paid: invoice.advance_paid || 0
    });
    setLineItems(invoice.line_items || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchInvoices();
      alert('Invoice deleted');
    } catch (error: any) {
      console.error('Error deleting invoice:', error.message);
      alert('Error deleting invoice');
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    await generateInvoicePDF({
      ...invoice,
      advance_paid: invoice.advance_paid || 0,
      balance_due: invoice.balance_due || invoice.grand_total
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSourceQuotationId(null);
    setSelectedCustomerId('');
    setFormData({
      invoice_date: new Date().toISOString().split('T')[0],
      place_of_supply: '29-Karnataka',
      pipeline_source: 'Sales',
      customer_title: '',
      customer_name: '',
      customer_contact: '',
      customer_gst_number: '',
      customer_address: '',
      billing_address: '',
      eway_bill_number: '',
      advance_paid: 0
    });
    setLineItems([emptyLineItem()]);
  };

  const totals = calculateInvoiceTotals(lineItems);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' ||
      invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number.toString().includes(searchQuery);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage invoices and billing</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-brand-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {!showForm && !viewInvoice && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-gray-900">
                <div className="text-sm text-gray-500">Total Invoices</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{invoices.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-gray-900">
                <div className="text-sm text-gray-500">Total Billed</div>
                <div className="text-xl font-semibold text-gray-900 mt-1">
                  {toINR(invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0))}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-gray-900">
                <div className="text-sm text-gray-500">This Month</div>
                <div className="text-xl font-semibold text-gray-900 mt-1">
                  {toINR(invoices
                    .filter(inv => inv.invoice_date.startsWith(new Date().toISOString().slice(0, 7)))
                    .reduce((sum, inv) => sum + Number(inv.grand_total), 0)
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-gray-900">
                <div className="text-sm text-gray-500">Last Invoice</div>
                <div className="text-xl font-semibold text-gray-900 mt-1">
                  {invoices.length > 0 ? `#${invoices[0].invoice_number}` : '—'}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer or invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Grand Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No invoices found. Click "New Invoice" to create one.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          INV-{invoice.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{formatCustomerName(invoice.customer_title, invoice.customer_name)}</div>
                          {invoice.customer_contact && (
                            <div className="text-xs text-gray-500">{invoice.customer_contact}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {invoice.line_items?.length || 0} items
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                          {toINR(invoice.grand_total)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewInvoice(invoice)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="View"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadInvoicePDF(invoice)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="text-gray-600 hover:text-gray-700 p-1"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Edit Invoice' : 'New Invoice'}
            </h2>
            {sourceQuotationId && (
              <span className="ml-3 mr-auto text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                From quotation — check the details and add e-way bill / advance before saving
              </span>
            )}
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
                  <input
                    type="text"
                    value={formData.place_of_supply}
                    onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.customer_title}
                      onChange={(e) => setFormData({ ...formData, customer_title: e.target.value })}
                      className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Title"
                    >
                      <option value="">Title</option>
                      {CUSTOMER_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter customer name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_contact}
                    onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address *</label>
                  <textarea
                    required
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter customer address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                  <textarea
                    value={formData.billing_address}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter billing address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer GST Number</label>
                  <input
                    type="text"
                    value={formData.customer_gst_number}
                    onChange={(e) => setFormData({ ...formData, customer_gst_number: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 29XXXXX1234X1ZX"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-way Bill Number</label>
                  <input
                    type="text"
                    value={formData.eway_bill_number}
                    onChange={(e) => setFormData({ ...formData, eway_bill_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter e-way bill number"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Line Items</h3>
              <LineItemsEditor items={lineItems} products={products} onChange={setLineItems} />
            </div>

            <div className="flex justify-end">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-80">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Taxable Amount</span>
                  <span className="font-semibold">{toINR(totals.taxableAmount)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Total GST</span>
                  <span className="font-semibold">{toINR(totals.gstTotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Sub Total</span>
                  <span className="font-semibold">{toINR(totals.subTotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Round Off</span>
                  <span className="font-semibold">{toINR(totals.roundOff)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold border-t border-gray-300 mt-2">
                  <span>Grand Total</span>
                  <span>{toINR(totals.grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm border-t border-gray-200 mt-2 pt-3">
                  <label className="text-gray-700 font-medium">Advance Paid</label>
                  <input
                    type="number"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })}
                    className="w-32 px-3 py-1 border border-gray-300 rounded text-right"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                {formData.advance_paid > 0 && (
                  <div className="flex justify-between py-2 text-sm font-bold text-blue-600">
                    <span>Balance Due</span>
                    <span>{toINR(totals.grandTotal - formData.advance_paid)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
              >
                Save & Preview
              </button>
            </div>
          </form>
        </div>
      )}

      {viewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-direction-column overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Invoice INV-{viewInvoice.invoice_number}</h3>
              <button
                onClick={() => setViewInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6" id="invoice-print-area">
              <div className="max-w-3xl mx-auto bg-white text-gray-900" style={{ fontSize: '11px' }}>
                <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b-4 border-gray-800">
                  <div>
                    <div className="text-3xl font-bold mb-2" style={{ letterSpacing: '2px' }}>Talwin AquaRay</div>
                    <div className="text-xs leading-relaxed text-gray-600">
                      Talwin AquaRay (formerly known as "Skanda Agencies")<br />
                      N0 34, Ground Floor, Nyanappanhalli, 80 Feet Road,<br />
                      BDA Layout BTM 4th Stage, Bengaluru, Karnataka 560076<br />
                      Phone: 70224 58515 | Email: info@talwin.in
                    </div>
                    <div className="text-xs font-bold mt-2">GSTIN: 29AOQPB3325K1ZQ | State: 29-Karnataka</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-3" style={{ letterSpacing: '1.5px' }}>Invoice</div>
                    <table className="ml-auto text-xs">
                      <tbody>
                        <tr>
                          <td className="py-1 pr-4 text-gray-600 font-semibold">Invoice No.</td>
                          <td className="py-1 font-bold">INV-{viewInvoice.invoice_number}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-4 text-gray-600 font-semibold">Date</td>
                          <td className="py-1 font-bold">{viewInvoice.invoice_date}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-4 text-gray-600 font-semibold">Supply</td>
                          <td className="py-1 font-bold">{viewInvoice.place_of_supply}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 border border-blue-200 p-3 mb-4 rounded-r">
                  <div className="text-xs text-gray-600 font-bold uppercase mb-1">Invoice For</div>
                  <div className="font-bold text-sm">{formatCustomerName(viewInvoice.customer_title, viewInvoice.customer_name)}</div>
                  {viewInvoice.customer_contact && (
                    <div className="text-xs text-gray-600 mt-1">Contact: {viewInvoice.customer_contact}</div>
                  )}
                  {viewInvoice.customer_gst_number && (
                    <div className="text-xs text-gray-600 mt-1">GSTIN: <span className="font-semibold">{viewInvoice.customer_gst_number}</span></div>
                  )}
                  {viewInvoice.customer_address && (
                    <div className="text-xs text-gray-600 mt-1">Address: {viewInvoice.customer_address}</div>
                  )}
                  {viewInvoice.billing_address && viewInvoice.billing_address !== viewInvoice.customer_address && (
                    <div className="text-xs text-gray-600 mt-1">Billing: {viewInvoice.billing_address}</div>
                  )}
                </div>

                <LineItemsPreview items={viewInvoice.line_items || []} gstTotal={viewInvoice.gst_total} />

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 font-bold uppercase mb-2">Amount in Words</div>
                    <div className="italic text-sm leading-relaxed">{numToWords(viewInvoice.grand_total)}</div>
                  </div>
                  <table className="text-xs">
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4 text-gray-600">Sub Total</td>
                        <td className="py-2 text-right font-semibold">₹{viewInvoice.sub_total.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 text-gray-600">Round Off</td>
                        <td className="py-2 text-right font-semibold">₹{viewInvoice.round_off.toFixed(2)}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-800 font-bold text-base">
                        <td className="py-2 pr-4">Grand Total</td>
                        <td className="py-2 text-right">₹{viewInvoice.grand_total.toFixed(2)}</td>
                      </tr>
                      {viewInvoice.advance_paid > 0 && (
                        <>
                          <tr className="border-t border-gray-300">
                            <td className="py-2 pr-4 text-gray-600">Advance Paid</td>
                            <td className="py-2 text-right font-semibold text-green-600">₹{viewInvoice.advance_paid.toFixed(2)}</td>
                          </tr>
                          <tr className="border-t-2 border-blue-600 font-bold text-base text-blue-600">
                            <td className="py-2 pr-4">Balance Due</td>
                            <td className="py-2 text-right">₹{viewInvoice.balance_due.toFixed(2)}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-bold uppercase text-gray-600 mb-2">GST Summary</div>
                  <table className="w-full text-xs border border-gray-200 rounded">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">HSN/SAC</th>
                        <th className="p-2 text-right">Taxable</th>
                        <th className="p-2 text-right">CGST Rate</th>
                        <th className="p-2 text-right">CGST Amt</th>
                        <th className="p-2 text-right">SGST Rate</th>
                        <th className="p-2 text-right">SGST Amt</th>
                        <th className="p-2 text-right">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateGSTSummary(viewInvoice.line_items || []).map((gst, i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="p-2">{gst.hsn}</td>
                          <td className="p-2 text-right">₹{gst.taxable.toFixed(2)}</td>
                          <td className="p-2 text-right">{gst.cgstRate}%</td>
                          <td className="p-2 text-right">₹{gst.cgstAmount.toFixed(2)}</td>
                          <td className="p-2 text-right">{gst.sgstRate}%</td>
                          <td className="p-2 text-right">₹{gst.sgstAmount.toFixed(2)}</td>
                          <td className="p-2 text-right">₹{gst.totalTax.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <td className="p-2">Total</td>
                        <td className="p-2 text-right">
                          ₹{calculateGSTSummary(viewInvoice.line_items || [])
                            .reduce((sum, gst) => sum + gst.taxable, 0)
                            .toFixed(2)}
                        </td>
                        <td></td>
                        <td className="p-2 text-right">
                          ₹{calculateGSTSummary(viewInvoice.line_items || [])
                            .reduce((sum, gst) => sum + gst.cgstAmount, 0)
                            .toFixed(2)}
                        </td>
                        <td></td>
                        <td className="p-2 text-right">
                          ₹{calculateGSTSummary(viewInvoice.line_items || [])
                            .reduce((sum, gst) => sum + gst.sgstAmount, 0)
                            .toFixed(2)}
                        </td>
                        <td className="p-2 text-right">₹{viewInvoice.gst_total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-300 text-xs">
                  <div>
                    <h4 className="font-bold uppercase mb-2">Bank Details</h4>
                    <p className="leading-relaxed text-gray-600">
                      Name: BANK OF BARODA<br />
                      Account No.: 89630200001898<br />
                      IFSC Code: BARB0VJMUSU<br />
                      Account Holder: TALWIN AQUARAY
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold uppercase mb-2">Terms & Conditions</h4>
                    {/* Left blank on purpose: terms are written in by hand on the printed copy. */}
                    <div className="h-24 border border-gray-300 rounded" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold uppercase mb-2">For: Talwin AquaRay</h4>
                    <div className="mt-12 pt-3 border-t border-gray-400 text-gray-600">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(viewInvoice);
                  setViewInvoice(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
              >
                Print / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
