import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, FileText, Printer, CreditCard as Edit2, Trash2, X, Download, ArrowRightCircle, CheckCircle } from 'lucide-react';
import {
  toINR, numToWords, calculateInvoiceTotals, calculateGSTSummary, emptyLineItem,
  CUSTOMER_TITLES, formatCustomerName, validateCustomerContact, type LineItem
} from '../lib/invoiceUtils';
import { generateQuotationPDF } from '../lib/quotationPdfGeneratorNew';
import LineItemsEditor, { type CatalogProduct } from './shared/LineItemsEditor';
import LineItemsPreview from './shared/LineItemsPreview';

interface Quotation {
  id: string;
  estimate_number: string;
  date: string;
  place_of_supply: string;
  pipeline_source: string;
  customer_title?: string;
  customer_name: string;
  contact_number: string;
  customer_gst_number?: string;
  customer_address?: string;
  billing_address?: string;
  area: string;
  terms_conditions?: string;
  converted_invoice_id?: string | null;
  sub_total: number;
  round_off: number;
  grand_total: number;
  created_at: string;
  line_items?: LineItem[];
}

interface PipelineCustomer {
  id: string;
  customer_name: string;
  phone_number: string;
  pipeline_source: string;
}

interface QuotationsProps {
  /** Called when the user converts a quotation; the parent opens a pre-filled invoice form. */
  onConvertToInvoice?: (quotation: Quotation) => void;
}

export default function Quotations({ onConvertToInvoice }: QuotationsProps = {}) {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [customers, setCustomers] = useState<PipelineCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    place_of_supply: '29-Karnataka',
    pipeline_source: 'Sales',
    customer_title: '',
    customer_name: '',
    contact_number: '',
    customer_gst_number: '',
    customer_address: '',
    billing_address: '',
    area: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);

  useEffect(() => {
    fetchQuotations();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchQuotations = async () => {
    try {
      const { data: quotationsData, error } = await supabase
        .from('quotations')
        .select('*')
        .order('estimate_number', { ascending: false });

      if (error) throw error;

      // line_items is stored as JSONB in the quotations table
      const quotationsWithItems = (quotationsData || []).map(quotation => ({
        ...quotation,
        line_items: Array.isArray(quotation.line_items) ? quotation.line_items : []
      }));

      setQuotations(quotationsWithItems);
    } catch (error: any) {
      console.error('Error fetching quotations:', error.message);
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
        contact_number: customer.phone_number || '',
        pipeline_source: customer.pipeline_source
      });
    } else {
      setFormData({
        ...formData,
        customer_name: '',
        contact_number: '',
        area: '',
        pipeline_source: 'Sales'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 SUBMITTING QUOTATION');
    console.log('📦 Line Items State:', lineItems);
    console.log('📊 Line Items Count:', lineItems.length);

    if (!formData.customer_name.trim()) {
      alert('Enter customer name');
      return;
    }

    const contactError = validateCustomerContact(formData.contact_number, formData.customer_address);
    if (contactError) {
      alert(contactError);
      return;
    }

    if (!formData.area.trim()) {
      alert('Enter area');
      return;
    }

    if (!lineItems.some(item => item.item_name && item.price_per_unit > 0)) {
      alert('Add at least one item with a price');
      return;
    }

    const totals = calculateInvoiceTotals(lineItems);

    console.log('💰 Calculated Totals:', totals);
    console.log('📝 Line Items to Save:', JSON.stringify(lineItems, null, 2));

    try {
      let estimateNumber: string;

      if (editingId) {
        const existing = quotations.find(quo => quo.id === editingId);
        estimateNumber = existing!.estimate_number;

        console.log('✏️ UPDATING quotation', editingId);
        console.log('📤 Sending line_items:', lineItems);

        const { error: quoError } = await supabase
          .from('quotations')
          .update({
            date: formData.date,
            place_of_supply: formData.place_of_supply,
            pipeline_source: formData.pipeline_source,
            customer_title: formData.customer_title,
            customer_name: formData.customer_name,
            contact_number: formData.contact_number,
            customer_gst_number: formData.customer_gst_number,
            customer_address: formData.customer_address,
            billing_address: formData.billing_address,
            area: formData.area,
            line_items: lineItems,
            sub_total: totals.subTotal,
            round_off: totals.roundOff,
            grand_total: totals.grandTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (quoError) throw quoError;
        console.log('✅ Quotation updated successfully');
      } else {
        // Generate next quotation number
        const { data: lastQuotation } = await supabase
          .from('quotations')
          .select('estimate_number')
          .order('estimate_number', { ascending: false })
          .limit(1)
          .single();

        let nextNumber = 100;
        if (lastQuotation && lastQuotation.estimate_number) {
          const lastNum = parseInt(lastQuotation.estimate_number.replace('QUO-', ''));
          nextNumber = lastNum + 1;
        }

        estimateNumber = `QUO-${nextNumber}`;

        console.log('➕ CREATING new quotation', estimateNumber);
        console.log('📤 Sending line_items:', lineItems);

        const { error: quoError } = await supabase
          .from('quotations')
          .insert([{
            user_id: user?.id,
            estimate_number: estimateNumber,
            date: formData.date,
            place_of_supply: formData.place_of_supply,
            pipeline_source: formData.pipeline_source,
            customer_title: formData.customer_title,
            customer_name: formData.customer_name,
            contact_number: formData.contact_number,
            customer_gst_number: formData.customer_gst_number,
            customer_address: formData.customer_address,
            billing_address: formData.billing_address,
            area: formData.area,
            line_items: lineItems,
            sub_total: totals.subTotal,
            round_off: totals.roundOff,
            grand_total: totals.grandTotal
          }])
          .select()
          .single();

        if (quoError) throw quoError;
        console.log('✅ Quotation created successfully');
      }

      resetForm();
      fetchQuotations();
      alert('Quotation saved successfully!');
    } catch (error: any) {
      console.error('Error saving quotation:', error.message);
      alert('Error saving quotation: ' + error.message);
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingId(quotation.id);
    const customer = customers.find(
      c => c.customer_name === quotation.customer_name && c.pipeline_source === quotation.pipeline_source
    );
    setSelectedCustomerId(customer?.id || '');
    setFormData({
      date: quotation.date,
      place_of_supply: quotation.place_of_supply,
      pipeline_source: quotation.pipeline_source,
      customer_title: quotation.customer_title || '',
      customer_name: quotation.customer_name,
      contact_number: quotation.contact_number,
      customer_gst_number: quotation.customer_gst_number || '',
      customer_address: quotation.customer_address || '',
      billing_address: quotation.billing_address || '',
      area: quotation.area || ''
    });
    setLineItems(quotation.line_items || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quotation? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchQuotations();
      alert('Quotation deleted');
    } catch (error: any) {
      console.error('Error deleting quotation:', error.message);
      alert('Error deleting quotation');
    }
  };

  const downloadQuotationPDF = async (quotation: Quotation) => {
    await generateQuotationPDF({
      ...quotation,
      customer_contact: quotation.contact_number
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedCustomerId('');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      place_of_supply: '29-Karnataka',
      pipeline_source: 'Sales',
      customer_title: '',
      customer_name: '',
      contact_number: '',
      customer_gst_number: '',
      customer_address: '',
      billing_address: '',
      area: ''
    });
    setLineItems([emptyLineItem()]);
  };

  const totals = calculateInvoiceTotals(lineItems);

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = searchQuery === '' ||
      quotation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.estimate_number.toString().includes(searchQuery);
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
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">Manage quotations and estimates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Quotation
        </button>
      </div>

      {!showForm && !viewQuotation && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Total Quotations</div>
                <div className="text-3xl font-bold mt-1">{quotations.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Total Estimated</div>
                <div className="text-2xl font-bold mt-1">
                  {toINR(quotations.reduce((sum, quo) => sum + Number(quo.grand_total), 0))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">This Month</div>
                <div className="text-2xl font-bold mt-1">
                  {toINR(quotations
                    .filter(quo => quo.date.startsWith(new Date().toISOString().slice(0, 7)))
                    .reduce((sum, quo) => sum + Number(quo.grand_total), 0)
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Last Quotation</div>
                <div className="text-xl font-bold mt-1">
                  {quotations.length > 0 ? quotations[0].estimate_number : '—'}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer or quotation number..."
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quotation No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Grand Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No quotations found. Click "New Quotation" to create one.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          {quotation.estimate_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(quotation.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{formatCustomerName(quotation.customer_title, quotation.customer_name)}</div>
                          {quotation.contact_number && (
                            <div className="text-xs text-gray-500">{quotation.contact_number}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {quotation.line_items?.length || 0} items
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                          {toINR(quotation.grand_total)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewQuotation(quotation)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="View"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadQuotationPDF(quotation)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(quotation)}
                              className="text-gray-600 hover:text-gray-700 p-1"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {quotation.converted_invoice_id ? (
                              <span className="text-green-600 p-1" title="Already converted to an invoice">
                                <CheckCircle className="w-4 h-4" />
                              </span>
                            ) : onConvertToInvoice && (
                              <button
                                onClick={() => onConvertToInvoice(quotation)}
                                className="text-amber-600 hover:text-amber-700 p-1"
                                title="Convert to Invoice"
                              >
                                <ArrowRightCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(quotation.id)}
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
              {editingId ? 'Edit Quotation' : 'New Quotation'}
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
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Quotation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Enter contact number"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Enter area"
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
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Save & Preview
              </button>
            </div>
          </form>
        </div>
      )}

      {viewQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-direction-column overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Quotation {viewQuotation.estimate_number}</h3>
              <button
                onClick={() => setViewQuotation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6" id="quotation-print-area">
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
                    <div className="text-2xl font-bold text-blue-600 mb-3" style={{ letterSpacing: '1.5px' }}>Quotation</div>
                    <table className="ml-auto text-xs">
                      <tbody>
                        <tr>
                          <td className="py-1 pr-4 text-gray-600 font-semibold">Quotation No.</td>
                          <td className="py-1 font-bold">{viewQuotation.estimate_number}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-4 text-gray-600 font-semibold">Date</td>
                          <td className="py-1 font-bold">{viewQuotation.date}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-4 text-gray-600 font-semibold">Supply</td>
                          <td className="py-1 font-bold">{viewQuotation.place_of_supply}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 border-l-4 border-blue-600 p-3 mb-4 rounded-r">
                  <div className="text-xs text-gray-600 font-bold uppercase mb-1">Quotation For</div>
                  <div className="font-bold text-sm">{formatCustomerName(viewQuotation.customer_title, viewQuotation.customer_name)}</div>
                  {viewQuotation.contact_number && (
                    <div className="text-xs text-gray-600 mt-1">Contact: {viewQuotation.contact_number}</div>
                  )}
                  {viewQuotation.customer_gst_number && (
                    <div className="text-xs text-gray-600 mt-1">GSTIN: <span className="font-semibold">{viewQuotation.customer_gst_number}</span></div>
                  )}
                  {viewQuotation.customer_address && (
                    <div className="text-xs text-gray-600 mt-1">Address: {viewQuotation.customer_address}</div>
                  )}
                  {viewQuotation.billing_address && viewQuotation.billing_address !== viewQuotation.customer_address && (
                    <div className="text-xs text-gray-600 mt-1">Billing: {viewQuotation.billing_address}</div>
                  )}
                  {viewQuotation.area && (
                    <div className="text-xs text-gray-600 mt-1">Area: {viewQuotation.area}</div>
                  )}
                </div>

                <LineItemsPreview
                  items={viewQuotation.line_items || []}
                  gstTotal={(viewQuotation.line_items || []).reduce((sum, item) => sum + item.gst_amount, 0)}
                />

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 font-bold uppercase mb-2">Amount in Words</div>
                    <div className="italic text-sm leading-relaxed">{numToWords(viewQuotation.grand_total)}</div>
                  </div>
                  <table className="text-xs">
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4 text-gray-600">Sub Total</td>
                        <td className="py-2 text-right font-semibold">₹{viewQuotation.sub_total.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 text-gray-600">Round Off</td>
                        <td className="py-2 text-right font-semibold">₹{viewQuotation.round_off.toFixed(2)}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-800 font-bold text-base">
                        <td className="py-2 pr-4">Total</td>
                        <td className="py-2 text-right">₹{viewQuotation.grand_total.toFixed(2)}</td>
                      </tr>
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
                      {calculateGSTSummary(viewQuotation.line_items || []).map((gst, i) => (
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
                          ₹{calculateGSTSummary(viewQuotation.line_items || [])
                            .reduce((sum, gst) => sum + gst.taxable, 0)
                            .toFixed(2)}
                        </td>
                        <td></td>
                        <td className="p-2 text-right">
                          ₹{calculateGSTSummary(viewQuotation.line_items || [])
                            .reduce((sum, gst) => sum + gst.cgstAmount, 0)
                            .toFixed(2)}
                        </td>
                        <td></td>
                        <td className="p-2 text-right">
                          ₹{calculateGSTSummary(viewQuotation.line_items || [])
                            .reduce((sum, gst) => sum + gst.sgstAmount, 0)
                            .toFixed(2)}
                        </td>
                        <td className="p-2 text-right">
                          ₹{viewQuotation.line_items?.reduce((sum, item) => sum + item.gst_amount, 0).toFixed(2)}
                        </td>
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
                onClick={() => setViewQuotation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(viewQuotation);
                  setViewQuotation(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
              {!viewQuotation.converted_invoice_id && onConvertToInvoice && (
                <button
                  onClick={() => {
                    onConvertToInvoice(viewQuotation);
                    setViewQuotation(null);
                  }}
                  className="px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-medium"
                >
                  Convert to Invoice
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
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
