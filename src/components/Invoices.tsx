import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, FileText, Printer, CreditCard as Edit2, Trash2, X, Download } from 'lucide-react';
import { toINR, numToWords, calculateLineItem, calculateInvoiceTotals, calculateGSTSummary, type LineItem } from '../lib/invoiceUtils';
import { generateInvoicePDF } from '../lib/pdfGeneratorNew';

interface Invoice {
  id: string;
  invoice_number: number;
  invoice_date: string;
  place_of_supply: string;
  pipeline_source: string;
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

interface Product {
  id: string;
  product_name: string;
  hsn_sac_code: string;
  mrp: number;
  unit_price: number;
  unit: string;
  gst_rate: number;
  description: string;
}

interface PipelineCustomer {
  id: string;
  customer_name: string;
  phone_number: string;
  pipeline_source: string;
}

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<PipelineCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editingTerms, setEditingTerms] = useState(false);
  const [termsEditValue, setTermsEditValue] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const defaultInvoiceTerms = `• Payment Terms: 100% before Dispatch.
• Invoice valid for 7 days from date of issue.
• Electrical / Civil / External Plumbing and Lifting of Materials — Customer scope.
• All Sales Are Final. No Refunds or Exchanges.
• All disputes are subject to Bengaluru jurisdiction.
• Warranty: 1 Year warranty applicable as per Company Norms & Service at Authorized Service Center / As mentioned in warranty card.`;

  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    place_of_supply: '29-Karnataka',
    pipeline_source: 'Sales',
    customer_name: '',
    customer_contact: '',
    customer_gst_number: '',
    customer_address: '',
    billing_address: '',
    eway_bill_number: '',
    advance_paid: 0,
    terms_conditions: defaultInvoiceTerms
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      item_name: '',
      item_description: '',
      hsn_sac: '',
      mrp: 0,
      quantity: 1,
      unit: 'Pcs',
      price_per_unit: 0,
      gst_rate: 18,
      gst_amount: 0,
      total_amount: 0
    }
  ]);

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
    fetchCustomers();
  }, []);

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

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    console.log('🔵 Product selected:', product.product_name);

    const updated = [...lineItems];
    updated[index] = calculateLineItem({
      ...updated[index],
      item_name: product.product_name,
      item_description: product.description || '',
      hsn_sac: product.hsn_sac_code || '',
      mrp: product.mrp || 0,
      price_per_unit: product.unit_price || 0,
      unit: product.unit || 'Pcs',
      gst_rate: product.gst_rate ?? 18
    });
    setLineItems(updated);
    console.log('📦 Line items after product select:', updated);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = calculateLineItem({
      ...updated[index],
      [field]: value
    });
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: crypto.randomUUID(),
      item_name: '',
      item_description: '',
      hsn_sac: '',
      mrp: 0,
      quantity: 1,
      unit: 'Pcs',
      price_per_unit: 0,
      gst_rate: 18,
      gst_amount: 0,
      total_amount: 0
    }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      alert('Need at least one item');
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
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
            customer_name: formData.customer_name,
            customer_contact: formData.customer_contact,
            customer_gst_number: formData.customer_gst_number,
            customer_address: formData.customer_address,
            billing_address: formData.billing_address,
            eway_bill_number: formData.eway_bill_number,
            terms_conditions: formData.terms_conditions,
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

        const { error: invError } = await supabase
          .from('invoices')
          .insert([{
            user_id: user?.id,
            invoice_number: invoiceNumber,
            invoice_date: formData.invoice_date,
            place_of_supply: formData.place_of_supply,
            pipeline_source: formData.pipeline_source,
            customer_name: formData.customer_name,
            customer_contact: formData.customer_contact,
            customer_gst_number: formData.customer_gst_number,
            customer_address: formData.customer_address,
            billing_address: formData.billing_address,
            eway_bill_number: formData.eway_bill_number,
            terms_conditions: formData.terms_conditions,
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
      customer_name: invoice.customer_name,
      customer_contact: invoice.customer_contact,
      customer_gst_number: invoice.customer_gst_number || '',
      customer_address: invoice.customer_address || '',
      billing_address: invoice.billing_address || '',
      eway_bill_number: invoice.eway_bill_number || '',
      advance_paid: invoice.advance_paid || 0,
      terms_conditions: invoice.terms_conditions || defaultInvoiceTerms
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

  const saveInvoiceTerms = async () => {
    if (!viewInvoice) return;
    const { error } = await supabase
      .from('invoices')
      .update({ terms_conditions: termsEditValue })
      .eq('id', viewInvoice.id);
    if (!error) {
      const updated = { ...viewInvoice, terms_conditions: termsEditValue };
      setViewInvoice(updated);
      setInvoices(prev => prev.map(inv => inv.id === viewInvoice.id ? updated : inv));
      setEditingTerms(false);
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    await generateInvoicePDF({
      ...invoice,
      customer_gst_number: invoice.customer_gst_number,
      terms_conditions: invoice.terms_conditions,
      advance_paid: invoice.advance_paid || 0,
      balance_due: invoice.balance_due || invoice.grand_total
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedCustomerId('');
    setFormData({
      invoice_date: new Date().toISOString().split('T')[0],
      place_of_supply: '29-Karnataka',
      pipeline_source: 'Sales',
      customer_name: '',
      customer_contact: '',
      customer_gst_number: '',
      customer_address: '',
      billing_address: '',
      eway_bill_number: '',
      advance_paid: 0,
      terms_conditions: defaultInvoiceTerms
    });
    setLineItems([{
      id: crypto.randomUUID(),
      item_name: '',
      item_description: '',
      hsn_sac: '',
      mrp: 0,
      quantity: 1,
      unit: 'Pcs',
      price_per_unit: 0,
      gst_rate: 18,
      gst_amount: 0,
      total_amount: 0
    }]);
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage invoices and billing</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 text-gray-900 px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {!showForm && !viewInvoice && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Total Invoices</div>
                <div className="text-3xl font-bold mt-1">{invoices.length}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Total Billed</div>
                <div className="text-2xl font-bold mt-1">
                  {toINR(invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">This Month</div>
                <div className="text-2xl font-bold mt-1">
                  {toINR(invoices
                    .filter(inv => inv.invoice_date.startsWith(new Date().toISOString().slice(0, 7)))
                    .reduce((sum, inv) => sum + Number(inv.grand_total), 0)
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Last Invoice</div>
                <div className="text-xl font-bold mt-1">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Grand Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
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
                          <div className="font-medium text-gray-900">{invoice.customer_name}</div>
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
                              onClick={() => { setViewInvoice(invoice); setEditingTerms(false); }}
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Edit Invoice' : 'New Invoice'}
            </h2>
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
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    value={formData.customer_contact}
                    onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
                  <textarea
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
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-2 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left min-w-[200px]">Product / Item</th>
                      <th className="px-2 py-2 text-left">HSN/SAC</th>
                      <th className="px-2 py-2 text-left">MRP</th>
                      <th className="px-2 py-2 text-left">Qty</th>
                      <th className="px-2 py-2 text-left">Unit</th>
                      <th className="px-2 py-2 text-left">Price/Unit</th>
                      <th className="px-2 py-2 text-left">GST%</th>
                      <th className="px-2 py-2 text-right">GST Amt</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-2 py-2 text-center text-gray-500">{index + 1}</td>
                        <td className="px-2 py-2">
                          <select
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1"
                          >
                            <option value="">-- Select from catalog --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.product_name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                            placeholder="Item name"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.hsn_sac || ''}
                            onChange={(e) => updateLineItem(index, 'hsn_sac', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.mrp || ''}
                            onChange={(e) => updateLineItem(index, 'mrp', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                            min="1"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option>Pcs</option>
                            <option>Set</option>
                            <option>Nos</option>
                            <option>KW</option>
                            <option>LPH</option>
                            <option>Litre</option>
                            <option>HP</option>
                            <option>LPD</option>
                            <option>-</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.price_per_unit}
                            onChange={(e) => updateLineItem(index, 'price_per_unit', parseFloat(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                            step="0.01"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={item.gst_rate}
                            onChange={(e) => updateLineItem(index, 'gst_rate', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option>0</option>
                            <option>5</option>
                            <option>8.9</option>
                            <option>12</option>
                            <option>18</option>
                            <option>28</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right text-xs font-semibold">
                          {item.gst_amount.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right text-xs font-semibold">
                          {item.total_amount.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Row
              </button>
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

            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Terms &amp; Conditions</h3>
              <textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={6}
                placeholder="Enter terms and conditions..."
              />
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
                className="px-6 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Save & Preview
              </button>
            </div>
          </form>
        </div>
      )}

      {viewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-direction-column overflow-hidden">
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

                <div className="bg-gray-50 border-l-4 border-blue-600 p-3 mb-4 rounded-r">
                  <div className="text-xs text-gray-600 font-bold uppercase mb-1">Invoice For</div>
                  <div className="font-bold text-sm">{viewInvoice.customer_name}</div>
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

                <table className="w-full mb-4 text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Item Name & Description</th>
                      <th className="p-2 text-left">HSN/SAC</th>
                      <th className="p-2 text-right">MRP</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-left">Unit</th>
                      <th className="p-2 text-right">Price/Unit</th>
                      <th className="p-2 text-right">GST</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.line_items?.map((item, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="p-2 text-center text-gray-500">{i + 1}</td>
                        <td className="p-2">
                          <div className="font-semibold">{item.item_name}</div>
                          {item.item_description && (
                            <div className="text-xs text-gray-500">{item.item_description}</div>
                          )}
                        </td>
                        <td className="p-2 text-gray-600">{item.hsn_sac || '—'}</td>
                        <td className="p-2 text-right">{item.mrp ? item.mrp.toFixed(2) : '—'}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2">{item.unit}</td>
                        <td className="p-2 text-right">₹{item.price_per_unit.toFixed(2)}</td>
                        <td className="p-2 text-right text-xs">
                          ₹{item.gst_amount.toFixed(2)}<br />
                          <span className="text-gray-500">({item.gst_rate}%)</span>
                        </td>
                        <td className="p-2 text-right font-semibold">₹{item.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold border-t-2 border-b-2 border-gray-800">
                      <td colSpan={4}></td>
                      <td className="p-2 text-right">
                        {viewInvoice.line_items?.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td colSpan={2}></td>
                      <td className="p-2 text-right">₹{viewInvoice.gst_total.toFixed(2)}</td>
                      <td className="p-2 text-right">₹{viewInvoice.sub_total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

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
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold uppercase">Terms & Conditions</h4>
                      {!editingTerms && (
                        <button
                          onClick={() => {
                            setTermsEditValue(viewInvoice.terms_conditions || defaultInvoiceTerms);
                            setEditingTerms(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 p-0.5 rounded"
                          title="Edit Terms & Conditions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {editingTerms ? (
                      <div>
                        <textarea
                          value={termsEditValue}
                          onChange={(e) => setTermsEditValue(e.target.value)}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                          rows={7}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={saveInvoiceTerms}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTerms(false)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed text-gray-600 whitespace-pre-line">
                        {viewInvoice.terms_conditions || defaultInvoiceTerms}
                      </p>
                    )}
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
                ✏️ Edit
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                🖨️ Print / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
