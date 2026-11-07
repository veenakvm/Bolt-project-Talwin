import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, CreditCard as Edit2, X, Save, Trash2 } from 'lucide-react';

interface SalesEntry {
  id: string;
  source: string;
  customer_name: string;
  phone_number: string;
  city: string;
  area: string;
  site_visit_date: string;
  quotation_status: string;
  site_survey_planned: string;
  site_survey_date: string;
  targeted_date: string;
  technician_comments: string;
  estimated_value: number;
  comments: string;
  architect_id: string | null;
  vendor_id: string | null;
  product_id: string | null;
  created_at: string;
}

interface Architect {
  id: string;
  name: string;
  profession: string;
  company_name: string;
}

interface Vendor {
  id: string;
  name: string;
  company_name: string;
}

interface Product {
  id: string;
  product_name: string;
}

export default function SalesPipeline() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SalesEntry>>({});
  const [selectedProfession, setSelectedProfession] = useState('');
  const [editSelectedProfession, setEditSelectedProfession] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    source: 'Architect',
    customer_name: '',
    phone_number: '',
    city: 'Bangalore',
    area: '',
    site_visit_date: getTodayDate(),
    quotation_status: 'Pending',
    site_survey_planned: 'No',
    site_survey_date: '',
    targeted_date: '',
    technician_comments: '',
    estimated_value: '',
    comments: '',
    architect_id: '',
    vendor_id: '',
    product_id: ''
  });

  useEffect(() => {
    fetchEntries();
    fetchArchitects();
    fetchVendors();
    fetchProducts();
  }, []);

  const fetchArchitects = async () => {
    try {
      const { data, error } = await supabase
        .from('architects')
        .select('id, name, profession, company_name')
        .order('name');

      if (error) throw error;
      setArchitects(data || []);
    } catch (error: any) {
      console.error('Error fetching architects:', error.message);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, company_name')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name')
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_pipeline')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching sales entries:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('sales_pipeline').insert([
        {
          user_id: user?.id,
          ...formData,
          estimated_value: parseFloat(formData.estimated_value) || 0
        }
      ]);

      if (error) throw error;

      setFormData({
        source: 'Architect',
        customer_name: '',
        phone_number: '',
        city: 'Bangalore',
        area: '',
        site_visit_date: getTodayDate(),
        quotation_status: 'Pending',
        site_survey_planned: 'No',
        site_survey_date: '',
        targeted_date: '',
        technician_comments: '',
        estimated_value: '',
        comments: '',
        architect_id: '',
        vendor_id: '',
        product_id: ''
      });
      setSelectedProfession('');

      fetchEntries();
    } catch (error: any) {
      console.error('Error creating entry:', error.message);
    }
  };

  const startEditing = (entry: SalesEntry) => {
    setEditingId(entry.id);
    setEditFormData(entry);
    if (entry.architect_id) {
      const prof = architects.find(a => a.id === entry.architect_id);
      setEditSelectedProfession(prof?.profession || '');
    } else {
      setEditSelectedProfession('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_pipeline')
        .update({
          ...editFormData,
          estimated_value: parseFloat(String(editFormData.estimated_value || 0))
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditFormData({});
      fetchEntries();
    } catch (error: any) {
      console.error('Error updating entry:', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('sales_pipeline')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchEntries();
    } catch (error: any) {
      console.error('Error deleting entry:', error.message);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase();
    return (
      entry.customer_name?.toLowerCase().includes(query) ||
      entry.phone_number?.toLowerCase().includes(query) ||
      entry.city?.toLowerCase().includes(query) ||
      entry.area?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-700">
            <strong>Customer Feedback:</strong> Share this feedback form link with customers to collect their reviews and testimonials.
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSesIQNvW49ZpbhmLg2VJDjHUAMMw1LMUsrDEXkReID2ybdXtw/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Feedback Form
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-600" />
          New Sales Lead
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Architect">Architect</option>
                <option value="Contractor">Contractor</option>
                <option value="Walk in Customer">Walk in Customer</option>
                <option value="Sales Lead">Sales Lead</option>
                <option value="Social Media/Online">Social Media/Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Bangalore">Bangalore</option>
                <option value="Mysore">Mysore</option>
                <option value="Mandya">Mandya</option>
                <option value="Maddur">Maddur</option>
                <option value="Chennai">Chennai</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Hubli">Hubli</option>
                <option value="Dharwad">Dharwad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visit Date
              </label>
              <input
                type="date"
                value={formData.site_visit_date}
                onChange={(e) => setFormData({ ...formData, site_visit_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Status
              </label>
              <select
                value={formData.quotation_status}
                onChange={(e) => setFormData({ ...formData, quotation_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Sent">Sent</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Survey Planned
              </label>
              <select
                value={formData.site_survey_planned}
                onChange={(e) => setFormData({ ...formData, site_survey_planned: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {formData.site_survey_planned === 'Yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Survey Date
                </label>
                <input
                  type="date"
                  value={formData.site_survey_date}
                  onChange={(e) => setFormData({ ...formData, site_survey_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.site_survey_planned === 'No' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Targeted Date
                  </label>
                  <input
                    type="date"
                    value={formData.targeted_date}
                    onChange={(e) => setFormData({ ...formData, targeted_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Person Comment
                  </label>
                  <input
                    type="text"
                    value={formData.technician_comments}
                    onChange={(e) => setFormData({ ...formData, technician_comments: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Value
              </label>
              <input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Type (Optional)
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => { setSelectedProfession(e.target.value); setFormData({ ...formData, architect_id: '' }); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option>Architect</option>
                <option>Plumber</option>
                <option>Contractor</option>
                <option>Electrician</option>
              </select>
            </div>

            {selectedProfession && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedProfession} Name
                </label>
                <select
                  value={formData.architect_id}
                  onChange={(e) => setFormData({ ...formData, architect_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select {selectedProfession}</option>
                  {architects.filter(a => (a.profession || 'Architect') === selectedProfession).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.company_name ? ` - ${a.company_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor (Optional)
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} {vendor.company_name && `- ${vendor.company_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product (Optional)
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Submit Entry
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Sales Pipeline Entries</h3>
          <span className="text-sm text-gray-600">{filteredEntries.length} entries</span>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, phone, city, or area..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Visit Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quotation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Survey</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.phone_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.city}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.site_visit_date ? new Date(entry.site_visit_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.quotation_status === 'Sent'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.quotation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.site_survey_planned === 'Yes'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {entry.site_survey_planned}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ₹{entry.estimated_value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(entry)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === entry.id && (
                    <tr className="bg-blue-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800">Edit Entry</h4>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                              <select
                                value={editFormData.source}
                                onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Architect">Architect</option>
                                <option value="Contractor">Contractor</option>
                                <option value="Walk in Customer">Walk in Customer</option>
                                <option value="Sales Lead">Sales Lead</option>
                                <option value="Social Media/Online">Social Media/Online</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                              <input
                                type="text"
                                value={editFormData.customer_name}
                                onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                              <input
                                type="tel"
                                value={editFormData.phone_number}
                                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                              <select
                                value={editFormData.city}
                                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Bangalore">Bangalore</option>
                                <option value="Mysore">Mysore</option>
                                <option value="Mandya">Mandya</option>
                                <option value="Maddur">Maddur</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Coimbatore">Coimbatore</option>
                                <option value="Hubli">Hubli</option>
                                <option value="Dharwad">Dharwad</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                              <input
                                type="text"
                                value={editFormData.area}
                                onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                              <input
                                type="date"
                                value={editFormData.site_visit_date}
                                onChange={(e) => setEditFormData({ ...editFormData, site_visit_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Status</label>
                              <select
                                value={editFormData.quotation_status}
                                onChange={(e) => setEditFormData({ ...editFormData, quotation_status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Sent">Sent</option>
                                <option value="Pending">Pending</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Site Survey Planned</label>
                              <select
                                value={editFormData.site_survey_planned}
                                onChange={(e) => setEditFormData({ ...editFormData, site_survey_planned: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>

                            {editFormData.site_survey_planned === 'Yes' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Site Survey Date</label>
                                <input
                                  type="date"
                                  value={editFormData.site_survey_date}
                                  onChange={(e) => setEditFormData({ ...editFormData, site_survey_date: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            {editFormData.site_survey_planned === 'No' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Targeted Date</label>
                                  <input
                                    type="date"
                                    value={editFormData.targeted_date}
                                    onChange={(e) => setEditFormData({ ...editFormData, targeted_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person Comment</label>
                                  <input
                                    type="text"
                                    value={editFormData.technician_comments}
                                    onChange={(e) => setEditFormData({ ...editFormData, technician_comments: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
                              <input
                                type="number"
                                value={editFormData.estimated_value}
                                onChange={(e) => setEditFormData({ ...editFormData, estimated_value: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                              <textarea
                                value={editFormData.comments}
                                onChange={(e) => setEditFormData({ ...editFormData, comments: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Type</label>
                              <select
                                value={editSelectedProfession}
                                onChange={(e) => { setEditSelectedProfession(e.target.value); setEditFormData({ ...editFormData, architect_id: null }); }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">None</option>
                                <option>Architect</option>
                                <option>Plumber</option>
                                <option>Contractor</option>
                                <option>Electrician</option>
                              </select>
                            </div>
                            {editSelectedProfession && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{editSelectedProfession} Name</label>
                                <select
                                  value={editFormData.architect_id || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, architect_id: e.target.value || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select {editSelectedProfession}</option>
                                  {architects.filter(a => (a.profession || 'Architect') === editSelectedProfession).map(a => (
                                    <option key={a.id} value={a.id}>{a.name}{a.company_name ? ` - ${a.company_name}` : ''}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(entry.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
